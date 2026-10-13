import { HttpError } from '../../utils/http-error.js';

export function createTasksService(repository) {
  return {
    list: () => repository.findAll(),

    async getById(id) {
      const task = await repository.findById(id);
      if (!task) throw HttpError.notFound(`La tarea ${id} no existe`);
      return task;
    },

    create: (data) => repository.create(data),

    async update(id, changes) {
      const task = await repository.update(id, changes);
      if (!task) throw HttpError.notFound(`La tarea ${id} no existe`);
      return task;
    },

    async remove(id) {
      const removed = await repository.remove(id);
      if (!removed) throw HttpError.notFound(`La tarea ${id} no existe`);
    },
  };
}
