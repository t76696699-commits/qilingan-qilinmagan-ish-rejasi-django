from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/main-task/add', views.add_main_task, name='add_main_task'),
    path('api/main-task/toggle/<int:main_id>', views.toggle_main_task, name='toggle_main_task'),
    path('api/main-task/delete/<int:main_id>', views.delete_main_task, name='delete_main_task'),
    path('api/main-task/<int:main_id>/subtasks', views.get_subtasks, name='get_subtasks'),
    path('api/subtask/add', views.add_subtask, name='add_subtask'),
    path('api/subtask/toggle/<int:sub_id>', views.toggle_subtask, name='toggle_subtask'),
    path('api/subtask/delete/<int:sub_id>', views.delete_subtask, name='delete_subtask'),
]