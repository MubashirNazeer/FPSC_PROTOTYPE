from rest_framework import serializers

from .models import NewsItem, Page, SiteSetting


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = "__all__"
        read_only_fields = ("updated_by",)


class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = "__all__"
        read_only_fields = ("author",)


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = "__all__"
