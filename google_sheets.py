import gspread
from google.oauth2.service_account import Credentials
import os
import time
import random

def get_google_sheet(worksheet_name='GUEST'):
    """Connect to Google Sheets and return the specified worksheet"""
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    creds_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
    creds = Credentials.from_service_account_file(creds_file, scopes=scopes)
    client = gspread.authorize(creds)
    
    sheet_url = os.getenv('GOOGLE_SHEET_URL')
    spreadsheet = client.open_by_url(sheet_url)
    
    # Get the specific worksheet by name, or create it if it doesn't exist
    try:
        worksheet = spreadsheet.worksheet(worksheet_name)
        print(f"Found worksheet: {worksheet_name}")
    except gspread.exceptions.WorksheetNotFound:
        print(f"Worksheet '{worksheet_name}' not found, creating it...")
        worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1000, cols=20)
    
    return worksheet

def get_guest_list_sheet():
    """Get the GUEST worksheet"""
    return get_google_sheet('GUEST')

def get_responses_sheet():
    """Get the GUEST RESPONSE worksheet"""
    return get_google_sheet('GUEST RESPONSE')

def load_guest_list():
    """Load guest list from GUEST worksheet"""
    worksheet = get_guest_list_sheet()
    records = worksheet.get_all_records()
    return records


def retry_on_quota_error(func, max_retries=5, base_delay=1):
    """Decorator to retry functions on quota exceeded errors with exponential backoff"""
    def wrapper(*args, **kwargs):
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except gspread.exceptions.APIError as e:
                if '429' in str(e) or 'Quota exceeded' in str(e):
                    if attempt < max_retries - 1:
                        delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                        print(f"Quota exceeded, retrying in {delay:.2f} seconds... (attempt {attempt + 1}/{max_retries})")
                        time.sleep(delay)
                        continue
                    else:
                        print("Max retries exceeded for quota error")
                        raise
                else:
                    raise
        return None
    return wrapper

@retry_on_quota_error
def clear_worksheet(worksheet):
    """Clear worksheet with retry on quota errors"""
    worksheet.clear()

@retry_on_quota_error
def append_rows_batch(worksheet, rows):
    """Append multiple rows at once with retry on quota errors"""
    worksheet.append_rows(rows)

def generate_invitation_letter(guest_name, pax, rsvp_link):
    """Generate an invitation letter for a guest"""
    first_name = guest_name.split()[0] if guest_name else 'Guest'
    
    letter = f"""Hiii {first_name} ! ☺️
    
Warm greetings!

We're delighted to share our Online Wedding Invitation as we celebrate our union on February 28, 2026. We have reserved {pax} seat(s) for you, and we would be truly honored by your presence.
Kindly confirm your attendance through the RSVP link below on or before JANUARY 16, 2026.

Thank you, and God bless! 🙏🏼

{rsvp_link}"""
    
    return letter

def sync_invitation_letters_to_sheet(rsvps):
    """Write invitation letters to INVITATION LETTERS worksheet"""
    try:
        print("Starting invitation letters sync...")
        
        worksheet = get_google_sheet('INVITATION LETTERS')
        print("Connected to INVITATION LETTERS worksheet successfully")
        
        # Clear existing data
        clear_worksheet(worksheet)
        print("Cleared existing data")
        
        if not rsvps:
            print("No RSVPs to sync")
            return
        
        # Define headers
        headers = ['Guest Name', 'Invitation Letter']
        
        # Prepare all rows including headers
        all_rows = [headers]
        
        # Generate invitation letter for each guest
        letters_written = 0
        for rsvp in rsvps:
            first_name = rsvp.guest_name.split()[0] if rsvp.guest_name else 'Guest'
            base_url = os.getenv('BASE_URL', 'https://ourforeverstory.online')
            rsvp_link = f"{base_url}/{rsvp.uid}"
            
            letter = generate_invitation_letter(rsvp.guest_name, rsvp.pax, rsvp_link)
            
            row = [rsvp.guest_name, letter]
            all_rows.append(row)
            letters_written += 1
        
        # Batch write all rows at once
        append_rows_batch(worksheet, all_rows)
        
        print(f"Successfully wrote {letters_written} invitation letters to INVITATION LETTERS worksheet")
        
    except Exception as e:
        print(f"Error in sync_invitation_letters_to_sheet: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

def sync_rsvps_to_sheet(rsvps):
    """Write RSVP data to GUEST RESPONSE worksheet - export cleaned columns"""
    try:
        print("Starting Google Sheets sync...")
        
        worksheet = get_responses_sheet()
        print("Connected to GUEST RESPONSE worksheet successfully")
        
        # Clear existing data except header
        clear_worksheet(worksheet)
        print("Cleared existing data")
        
        if not rsvps:
            print("No RSVPs to sync")
            return
        
        # Define which columns to export and their display names
        column_mapping = {
            'title': 'Title',
            'guest_name': 'Guest Name',
            'response': 'RSVP Response',
            'pax': 'Max Guests Allowed',
            'guest_count': 'Number Attending',
            'URL': 'RSVP Link',
            'response_date': 'RSVP Date',
            # Exclude: uid (internal ID)
        }
        
        # Get headers in the desired order
        headers = list(column_mapping.values())
        print(f"Headers to export: {headers}")
        
        # Prepare all rows including headers
        all_rows = [headers]
        
        # Write RSVP data for each RSVP
        rows_written = 0
        for rsvp in rsvps:
            rsvp_dict = rsvp.to_dict()
            row = []
            
            for db_field in column_mapping.keys():
                value = rsvp_dict.get(db_field, '')
                
                # Special handling for URL field
                if db_field == 'URL':
                    # Generate the RSVP URL using the guest's uid
                    base_url = os.getenv('BASE_URL', 'https://yourweddingsite.com')
                    value = f"{base_url}/{rsvp.uid}"
                
                # Format specific fields
                elif db_field == 'response_date' and value:
                    # Keep the formatted date as is
                    pass
                elif db_field == 'response':
                    # Capitalize the response
                    value = value.capitalize() if value else 'Pending'
                elif db_field in ['guest_count', 'pax']:
                    # Ensure numeric fields are properly formatted
                    value = int(value) if value else 0
                
                row.append(value)
            
            all_rows.append(row)
            rows_written += 1
        
        # Batch write headers and all rows at once
        append_rows_batch(worksheet, all_rows)
        
        # Add total row
        total_attending = sum(rsvp.guest_count for rsvp in rsvps)
        total_row = [''] * len(headers)
        total_row[list(column_mapping.values()).index('Guest Name')] = 'TOTAL'
        total_row[list(column_mapping.values()).index('Number Attending')] = total_attending
        
        append_rows_batch(worksheet, [total_row])
        
        print(f"Successfully wrote headers and {rows_written} data rows to GUEST RESPONSE worksheet")
        print(f"Total Number Attending: {total_attending}")
        
        # Also sync invitation letters
        sync_invitation_letters_to_sheet(rsvps)
        
    except Exception as e:
        print(f"Error in sync_rsvps_to_sheet: {str(e)}")
        import traceback
        traceback.print_exc()
        raise  # Re-raise the exception so it can be caught by the calling function
