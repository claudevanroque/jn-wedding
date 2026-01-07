from flask import Flask, render_template, request, jsonify
from models import db
from models.rsvp import RSVP
from dotenv import load_dotenv
from google_sheets import load_guest_list, sync_rsvps_to_sheet, get_guest_list_sheet, get_responses_sheet
import os
from datetime import datetime

load_dotenv()

app = Flask(__name__, instance_relative_config=True)

# Ensure instance folder exists
os.makedirs(app.instance_path, exist_ok=True)

# Configure database with absolute path
db_path = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///wedding.db')
if db_path.startswith('sqlite:///') and not db_path.startswith('sqlite:////') and not os.path.isabs(db_path.replace('sqlite:///', '')):
    # Convert relative path to absolute path in instance folder
    db_filename = db_path.replace('sqlite:///', '')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(app.instance_path, db_filename)}'
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_path

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.getenv('SQLALCHEMY_TRACK_MODIFICATIONS') == 'True'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Initialize db with app
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('invitation.html', rsvp=None)

@app.route('/<id>')
def invitation(id):
    rsvp = RSVP.query.filter_by(uid=id).first()
    if rsvp:
        return render_template('invitation.html', rsvp=rsvp)
    return render_template('invitation.html')

@app.route('/<id>/rsvp', methods=['GET', 'POST'])
def submit_rsvp_by_id(id):
    """Get or submit RSVP for a specific guest by their ID"""
    if request.method == 'GET':
        # Return existing RSVP data
        rsvp = RSVP.query.filter_by(uid=id).first()
        if rsvp:
            return jsonify(rsvp.to_dict()), 200
        return jsonify({'error': 'RSVP not found'}), 404
    
    # POST method
    data = request.get_json()
    
    # Find existing RSVP by ID
    existing_rsvp = RSVP.query.filter_by(uid=id).first()
    
    if existing_rsvp and data.get('guest_count', 0) > existing_rsvp.pax:
        return jsonify({'error': 'Your Guest count exceeds allowed Pax'}), 400

    if existing_rsvp:
        # Update existing RSVP
        existing_rsvp.response = data.get('response')
        existing_rsvp.guest_count = data.get('guest_count', 1)
        existing_rsvp.response_date = datetime.utcnow()
        db.session.commit()
        
        # Sync to Google Sheets
        try:
            rsvps = RSVP.query.all()
            sync_rsvps_to_sheet(rsvps)
        except Exception as e:
            print(f"Warning: Failed to sync to Google Sheets: {e}")
        
        return jsonify({'message': 'RSVP updated successfully', 'uid': existing_rsvp.uid}), 200
    else:
        # Don't create new RSVPs - only update existing ones
        return jsonify({'error': 'RSVP not found. Please contact the wedding organizers.'}), 404


@app.route('/api/load-from-sheet', methods=['GET'])
def load_from_sheet():
    """Load guest list from Google Sheets and import to database"""
    try:
        guests = get_guest_list_sheet().get_all_records()
        imported_count = 0
        skipped_count = 0
        imported_list = []
        skipped_list = []
        
        for guest in guests:
            guest_name = guest.get('Guest Name') or guest.get('Name')
            
            # Skip if already exists (check by guest name)
            existing = RSVP.query.filter_by(guest_name=guest_name).first()
            if existing:
                skipped_count += 1
                skipped_list.append({
                    'name': guest_name,
                    'reason': 'Already exists in database'
                })
                continue
            
            # Create RSVP entry from sheet data
            new_rsvp = RSVP(
                title=guest.get('Title', None),
                guest_name=guest_name or 'Anonymous',
                pax=int(guest.get('Pax', 1)),
                response=guest.get('Response') or 'pending',
                guest_count=int(guest.get('Guest Count') or guest.get('Count', 0))
            )
            db.session.add(new_rsvp)
            imported_count += 1
            imported_list.append(guest_name)
        
        db.session.commit()
        return jsonify({
            'message': f'Imported {imported_count} guests, skipped {skipped_count} duplicates',
            'imported': imported_count,
            'skipped': skipped_count,
            'total': len(guests),
            'imported_names': imported_list,
            'skipped_details': skipped_list
        }), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-google-sheets', methods=['GET'])
def test_google_sheets():
    """Test Google Sheets connection"""
    try:
        worksheet = get_responses_sheet()
        sheet_title = worksheet.title
        return jsonify({
            'status': 'success',
            'sheet_title': sheet_title,
            'message': 'Google Sheets connection successful'
        }), 200
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return jsonify({
            'status': 'error',
            'error': str(e),
            'traceback': error_details
        }), 500

@app.route('/api/sync-to-sheet', methods=['GET'])
def sync_to_sheet():
    """Sync all RSVPs to Google Sheets"""
    try:
        rsvps = RSVP.query.all()
        print(f"Found {len(rsvps)} RSVPs to sync")
        
        if not rsvps:
            return jsonify({'message': 'No RSVPs to sync'}), 200

        
        sync_rsvps_to_sheet(rsvps)
        return jsonify({'message': f'Synced {len(rsvps)} RSVPs to Google Sheets'}), 200
    except Exception as e:
        import traceback
        print(f"Error syncing to Google Sheets: {str(e)}")
        print("Full traceback:")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()
