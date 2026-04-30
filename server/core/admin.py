from django.contrib import admin
from .models import User, School, MarketingRequest, CommunicationLog, Document

admin.site.register(User)
admin.site.register(School)
admin.site.register(MarketingRequest)
admin.site.register(CommunicationLog)
admin.site.register(Document)
