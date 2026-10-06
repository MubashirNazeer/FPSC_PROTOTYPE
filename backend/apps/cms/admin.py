from django.contrib import admin

from .models import NewsItem, Page, SiteSetting

admin.site.register(Page)
admin.site.register(NewsItem)
admin.site.register(SiteSetting)
