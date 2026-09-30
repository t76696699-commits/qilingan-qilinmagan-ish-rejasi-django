from django.db import models


class MainTask(models.Model):
    title = models.CharField(max_length=200)

    def is_all_completed(self):
        subtasks = self.subtasks.all()
        if not subtasks.exists():
            return False
        return all(sub.is_done for sub in subtasks)

    def __str__(self):
        return self.title


class SubTask(models.Model):
    main_task = models.ForeignKey(MainTask, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=200)
    is_done = models.BooleanField(default=False)

    def __str__(self):
        return self.title
