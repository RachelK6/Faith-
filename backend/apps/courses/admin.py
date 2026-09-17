from django.contrib import admin
from .models import Course, Module, Lesson, Activity, LessonAttachment

admin.site.register(Course)
admin.site.register(Module)
admin.site.register(Lesson)
admin.site.register(Activity)
admin.site.register(LessonAttachment)
