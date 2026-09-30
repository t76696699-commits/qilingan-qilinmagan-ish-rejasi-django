import json

from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import MainTask, SubTask


def index(request):
    main_tasks = MainTask.objects.all()
    tasks_data = []
    for task in main_tasks:
        tasks_data.append({
            'id': task.id,
            'title': task.title,
            'is_completed': task.is_all_completed()
        })
    return render(request, 'index.html', {'main_tasks': tasks_data})


@csrf_exempt
def add_main_task(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        title = data.get('title', '').strip()
        if not title:
            return JsonResponse({'error': 'Title required'}, status=400)

        main_task = MainTask.objects.create(title=title)
        return JsonResponse({'id': main_task.id, 'title': main_task.title, 'is_completed': False})


@csrf_exempt
def toggle_main_task(request, main_id):
    if request.method == 'POST':
        main_task = get_object_or_404(MainTask, pk=main_id)
        new_state = not main_task.is_all_completed()
        main_task.subtasks.update(is_done=new_state)

        return JsonResponse({
            'id': main_task.id,
            'is_completed': main_task.is_all_completed()
        })


@csrf_exempt
def delete_main_task(request, main_id):
    if request.method == 'DELETE':
        main_task = get_object_or_404(MainTask, pk=main_id)
        main_task.delete()
        return JsonResponse({'success': True})


def get_subtasks(request, main_id):
    main_task = get_object_or_404(MainTask, pk=main_id)
    subtasks = list(main_task.subtasks.values('id', 'title', 'is_done'))
    return JsonResponse({
        'main_id': main_task.id,
        'main_title': main_task.title,
        'subtasks': subtasks,
        'is_completed': main_task.is_all_completed()
    })


@csrf_exempt
def add_subtask(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        main_id = data.get('main_task_id')
        title = data.get('title', '').strip()

        if not main_id or not title:
            return JsonResponse({'error': 'Ma\'lumot yetarli emas'}, status=400)

        main_task = get_object_or_404(MainTask, pk=main_id)
        sub = SubTask.objects.create(main_task=main_task, title=title)
        return JsonResponse({
            'id': sub.id,
            'title': sub.title,
            'is_done': sub.is_done,
            'main_task_id': sub.main_task_id,
            'main_is_completed': main_task.is_all_completed()
        })


@csrf_exempt
def toggle_subtask(request, sub_id):
    if request.method == 'POST':
        sub = get_object_or_404(SubTask, pk=sub_id)
        sub.is_done = not sub.is_done
        sub.save()
        return JsonResponse({
            'id': sub.id,
            'title': sub.title,
            'is_done': sub.is_done,
            'main_task_id': sub.main_task.id,
            'main_is_completed': sub.main_task.is_all_completed()
        })


@csrf_exempt
def delete_subtask(request, sub_id):
    if request.method == 'DELETE':
        sub = get_object_or_404(SubTask, pk=sub_id)
        main_task = sub.main_task
        sub.delete()
        return JsonResponse({
            'success': True,
            'main_task_id': main_task.id,
            'main_is_completed': main_task.is_all_completed()
        })
