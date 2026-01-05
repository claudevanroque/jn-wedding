import gspread
from google.oauth2.service_account import Credentials
import os

def get_google_sheet():
    """Connect to Google Sheets and return the worksheet"""
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    creds_file = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
    creds = Credentials.from_service_account_file(creds_file, scopes=scopes)
    client = gspread.authorize(creds)
    
    sheet_url = os.getenv('GOOGLE_GUEST_SHEET_URL')
    spreadsheet = client.open_by_url(sheet_url)
    return spreadsheet.sheet1  # First sheet

def load_guest_list():
    """Load guest list from Google Sheets"""
    worksheet = get_google_sheet()
    records = worksheet.get_all_records()
    return records

def sync_rsvps_to_sheet(rsvps):
    """Write RSVP data to Google Sheets"""
    worksheet = get_google_sheet()
    
    # Clear existing data except header
    worksheet.clear()
    
    # Write headers
    headers = ['Guest Name', 'Response', 'Guest Count', 'Created At']
    worksheet.append_row(headers)
    
    # Write RSVP data
    for rsvp in rsvps:
        row = [
            rsvp.guest_name,
            rsvp.response,
            rsvp.guest_count,
            rsvp.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ]
        worksheet.append_row(row)
