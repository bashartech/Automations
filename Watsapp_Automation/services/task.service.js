const database = require('../database');
const chrono = require('chrono-node');

class TaskService {
  constructor() {
    this.enabled = true;
  }

  // Create task from natural language
  async createTask(userPhone, message) {
    try {
      // Parse task details
      const taskInfo = this.parseTaskMessage(message);

      const result = await database.createTask(
        userPhone,
        taskInfo.title,
        taskInfo.description,
        taskInfo.priority,
        taskInfo.dueDate
      );

      await database.logAction(userPhone, 'create_task', taskInfo, true);

      return {
        success: true,
        message: `✅ *Task Created*\n\n📝 ${taskInfo.title}\n${taskInfo.priority ? `⚡ Priority: ${taskInfo.priority}\n` : ''}${taskInfo.dueDate ? `📅 Due: ${new Date(taskInfo.dueDate).toLocaleDateString()}\n` : ''}\n✨ Task ID: ${result.id}`,
        taskId: result.id
      };
    } catch (error) {
      console.error('Create task error:', error.message);
      await database.logAction(userPhone, 'create_task', { error: error.message }, false);
      return {
        success: false,
        message: "Failed to create task. Please try again."
      };
    }
  }

  // Parse task from message
  parseTaskMessage(message) {
    // Remove common prefixes
    let text = message
      .replace(/^(add task|create task|new task|task|todo|add|create)[:|\s]*/i, '')
      .trim();

    // Extract priority
    let priority = 'medium';
    const priorityMatch = text.match(/\b(low|medium|high|urgent)\b/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toLowerCase();
      if (priority === 'urgent') priority = 'high';
      text = text.replace(priorityMatch[0], '').trim();
    }

    // Extract due date using chrono
    let dueDate = null;
    const dateResults = chrono.parse(text);
    if (dateResults.length > 0) {
      dueDate = dateResults[0].start.date().toISOString();
      // Remove date text from title
      text = text.replace(dateResults[0].text, '').trim();
    }

    // Clean up title
    const title = text.replace(/\s+/g, ' ').trim();

    return {
      title: title || 'Untitled Task',
      description: '',
      priority,
      dueDate
    };
  }

  // Get user tasks
  async getTasks(userPhone, filter = 'all') {
    try {
      let status = null;
      if (filter === 'pending') status = 'pending';
      if (filter === 'completed') status = 'completed';

      const tasks = await database.getUserTasks(userPhone, status);

      if (tasks.length === 0) {
        return {
          success: true,
          message: filter === 'completed'
            ? "✅ No completed tasks yet."
            : "📝 No pending tasks. You're all caught up!"
        };
      }

      let message = `📋 *Your Tasks*\n\n`;

      const pending = tasks.filter(t => t.status === 'pending');
      const completed = tasks.filter(t => t.status === 'completed');

      if (filter === 'all' || filter === 'pending') {
        if (pending.length > 0) {
          message += `*Pending (${pending.length}):*\n`;
          pending.forEach((task, i) => {
            message += `\n${i + 1}. ${task.title}`;
            if (task.priority === 'high') message += ' 🔴';
            if (task.due_date) {
              const dueDate = new Date(task.due_date);
              message += `\n   📅 Due: ${dueDate.toLocaleDateString()}`;
            }
            message += `\n   ID: ${task.id}\n`;
          });
        }
      }

      if (filter === 'all' || filter === 'completed') {
        if (completed.length > 0) {
          message += `\n*Completed (${completed.length}):*\n`;
          completed.slice(0, 5).forEach((task, i) => {
            message += `\n${i + 1}. ✅ ${task.title}\n`;
          });
        }
      }

      message += `\n💡 *Commands:*\n`;
      message += `• Complete task: "complete task [ID]"\n`;
      message += `• Delete task: "delete task [ID]"`;

      return {
        success: true,
        message,
        tasks
      };
    } catch (error) {
      console.error('Get tasks error:', error.message);
      return {
        success: false,
        message: "Failed to retrieve tasks."
      };
    }
  }

  // Complete task
  async completeTask(userPhone, taskId) {
    try {
      await database.updateTaskStatus(taskId, 'completed');
      await database.logAction(userPhone, 'complete_task', { taskId }, true);

      return {
        success: true,
        message: `✅ Task #${taskId} marked as completed!`
      };
    } catch (error) {
      console.error('Complete task error:', error.message);
      return {
        success: false,
        message: "Failed to complete task."
      };
    }
  }

  // Delete task
  async deleteTask(userPhone, taskId) {
    try {
      await database.deleteTask(taskId);
      await database.logAction(userPhone, 'delete_task', { taskId }, true);

      return {
        success: true,
        message: `🗑️ Task #${taskId} deleted.`
      };
    } catch (error) {
      console.error('Delete task error:', error.message);
      return {
        success: false,
        message: "Failed to delete task."
      };
    }
  }

  // Handle task command
  async handleTaskCommand(userPhone, message) {
    const lowerMessage = message.toLowerCase();

    // List tasks
    if (lowerMessage.match(/^(show|list|view|get|my)\s*(tasks?|todos?)/i)) {
      if (lowerMessage.includes('completed')) {
        return await this.getTasks(userPhone, 'completed');
      }
      return await this.getTasks(userPhone, 'pending');
    }

    // Complete task
    const completeMatch = lowerMessage.match(/complete\s+task\s+(\d+)/i);
    if (completeMatch) {
      return await this.completeTask(userPhone, parseInt(completeMatch[1]));
    }

    // Delete task
    const deleteMatch = lowerMessage.match(/delete\s+task\s+(\d+)/i);
    if (deleteMatch) {
      return await this.deleteTask(userPhone, parseInt(deleteMatch[1]));
    }

    // Create task
    if (lowerMessage.match(/^(add|create|new)\s+(task|todo)/i)) {
      return await this.createTask(userPhone, message);
    }

    // Conversational statements about tasks (not commands)
    // Return null to let AI handle conversationally
    if (lowerMessage.match(/(will|want to|going to|plan to).*(add|create|make).*(task|todo)/i)) {
      return null; // Let AI respond conversationally
    }

    // If no pattern matched, return null to fall back to AI
    return null;
  }
}

module.exports = new TaskService();
