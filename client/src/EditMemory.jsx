import MemoryForm from './MemoryForm';
import { updateMemory } from './api';

function EditMemory({ memory, onClose, onUpdated }) {
  return (
    <MemoryForm
      heading="编辑回忆"
      submitLabel="保存修改"
      initial={memory}
      onClose={onClose}
      onSubmit={async (data) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('登录状态已失效，请重新登录');
        await updateMemory(token, memory.id, data);
        onUpdated();
      }}
    />
  );
}

export default EditMemory;
