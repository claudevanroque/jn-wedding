from datetime import datetime
from models import db
import uuid

class RSVP(db.Model):
    uid = db.Column(db.String(36), primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(10), nullable=True)
    guest_name = db.Column(db.String(200), nullable=False)
    pax = db.Column(db.Integer, default=1)
    response = db.Column(db.String(20), nullable=False)  # 'accept' or 'decline'
    guest_count = db.Column(db.Integer, default=1)
    response_date = db.Column(db.DateTime)
    def __repr__(self):
        return f'<RSVP {self.guest_name} - {self.response}>'
    
    def to_dict(self):
        return {
            'uid': self.uid,
            'title': self.title,
            'guest_name': self.guest_name,
            'pax': self.pax,
            'response': self.response,
            'guest_count': self.guest_count,
            'response_date': self.response_date.strftime('%Y-%m-%d %H:%M:%S') if self.response_date else None
        }
