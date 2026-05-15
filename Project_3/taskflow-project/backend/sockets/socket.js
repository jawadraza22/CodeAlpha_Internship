const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User joined project room: project_${projectId}`);
    });

    socket.on('task_update', (data) => {
      // data: { projectId, taskId, updateType }
      socket.to(`project_${data.projectId}`).emit('task_updated', data);
    });

    socket.on('new_comment', (data) => {
      // data: { projectId, taskId, comment }
      socket.to(`project_${data.projectId}`).emit('comment_added', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

module.exports = { setupSocket };
