from flask import Flask, render_template, request, jsonify
from models import db
from models.rsvp import RSVP
from dotenv import load_dotenv
from google_sheets import load_guest_list, sync_rsvps_to_sheet
import os

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.getenv('SQLALCHEMY_TRACK_MODIFICATIONS') == 'True'
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return render_template('invitation.html')



@app.route('/api/rsvp', methods=['POST'])
def submit_rsvp():
    data = request.get_json()
    
    new_rsvp = RSVP(
        guest_name=data.get('guest_name', 'Anonymous'),
        response=data.get('response'),
        guest_count=data.get('guest_count', 1)
    )
    
    db.session.add(new_rsvp)
    db.session.commit()
    
    return jsonify({'message': 'RSVP submitted successfully', 'uid': new_rsvp.uid}), 201

@app.route('/api/rsvps', methods=['GET'])
def get_rsvps():
    rsvps = RSVP.query.order_by(RSVP.created_at.desc()).all()
    return jsonify([rsvp.to_dict() for rsvp in rsvps])

@app.route('/api/load-from-sheet', methods=['GET'])
def load_from_sheet():
    """Load guest list from Google Sheets and import to database"""
    try:
        guests = load_guest_list()
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

@app.route('/api/sync-to-sheet', methods=['POST'])
def sync_to_sheet():
    """Sync all RSVPs to Google Sheets"""
    try:
        rsvps = RSVP.query.all()
        sync_rsvps_to_sheet(rsvps)
        return jsonify({'message': f'Synced {len(rsvps)} RSVPs to Google Sheets'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)