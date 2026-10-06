"""Module 4 — Official Website CMS."""
from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Page(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    body = models.TextField()
    is_published = models.BooleanField(default=False)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:50]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class NewsItem(models.Model):
    class Category(models.TextChoices):
        NOTICE = "NOTICE", "Notice"
        RESULT = "RESULT", "Result"
        PRESS = "PRESS", "Press Release"
        AD = "AD", "Advertisement"

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    category = models.CharField(
        max_length=16, choices=Category.choices, default=Category.NOTICE
    )
    summary = models.TextField(blank=True)
    body = models.TextField()
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:50]
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class SiteSetting(models.Model):
    key = models.CharField(max_length=64, unique=True)
    value = models.JSONField(default=dict)

    def __str__(self) -> str:
        return self.key
