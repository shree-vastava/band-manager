from app.database import Base

# Import all models here so Alembic can detect them
from app.models.user import User
from app.models.band import Band
from app.models.band_member import BandMember
from app.models.master_setlist import MasterSetlist
from app.models.song import Song
from app.models.setlist_song import SetlistSong
from app.models.show import Show
from app.models.show_payment import ShowPayment


__all__ = ["Base", "User", "Band", "BandMember", "MasterSetlist", "Song", "Show", "ShowPayment", "SetlistSong"]