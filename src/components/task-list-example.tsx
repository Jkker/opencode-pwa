import { CheckIcon, ClockIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import * as React from 'react'
import { useShallow } from 'zustand/react/shallow'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  addTask,
  setTaskStatus,
  setFilter as setTaskFilter,
  deleteTask,
  clearCompleted,
  useTasksStore,
  selectFilteredTasks,
  selectTaskStats,
} from '@/lib/tasks-store'
import { formatRelativeTime, isOverdue, isDueSoon } from '@/lib/temporal-utils'

export function TaskListExample() {
  const [open, setOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState('')
  const [newTaskDesc, setNewTaskDesc] = React.useState('')
  const tasks = useTasksStore(useShallow(selectFilteredTasks))
  const stats = useTasksStore(useShallow(selectTaskStats))
  const filter = useTasksStore((state) => state.filter)

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    const dueDate = Temporal.Now.plainDateTimeISO().add({ days: 7 }).toString()

    addTask({
      title: newTaskTitle,
      description: newTaskDesc,
      status: 'todo',
      priority: 'medium',
      dueDate,
    })

    setNewTaskTitle('')
    setNewTaskDesc('')
    setOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Task Manager</CardTitle>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Create New Task</DrawerTitle>
                <DrawerDescription>Add a new task to your list</DrawerDescription>
              </DrawerHeader>
              <div className="grid gap-4 p-4">
                <div className="grid gap-2">
                  <label htmlFor="task-title">Title</label>
                  <Input
                    id="task-title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="task-desc">Description</label>
                  <Textarea
                    id="task-desc"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Task description"
                  />
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleAddTask}>Add Task</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="flex gap-2 mt-4">
          {(['all', 'active', 'completed'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTaskFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)} (
              {filterType === 'all'
                ? stats.total
                : filterType === 'active'
                  ? stats.todo + stats.inProgress
                  : stats.done}
              )
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tasks yet. Create your first task!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className={`mt-0.5 ${task.status === 'done' ? 'text-green-500' : 'text-muted-foreground'}`}
                  onClick={() => setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                >
                  <CheckIcon className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {task.title}
                    </p>
                    <Badge
                      variant={
                        task.priority === 'high'
                          ? 'destructive'
                          : task.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-muted-foreground text-sm mt-1">{task.description}</p>
                  )}
                  {task.dueDate && task.status !== 'done' && (
                    <div className="flex items-center gap-1 mt-2">
                      <ClockIcon className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={`text-xs ${isOverdue(task.dueDate) ? 'text-destructive' : isDueSoon(task.dueDate) ? 'text-orange-500' : 'text-muted-foreground'}`}
                      >
                        {formatRelativeTime(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        {stats.done > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={clearCompleted} className="w-full">
              <Trash2Icon className="mr-2 h-4 w-4" />
              Clear Completed ({stats.done})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
