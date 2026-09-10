import MemoryForm from './MemoryForm';
import { updateMemory } from './api';
import { t, useT } from './i18n';

function EditMemory({ memory, onClose, onUpdated }) {
  useT(); // 订阅语言：切换语言时弹窗标题/按钮跟着变
  return (
    <MemoryForm
      heading={t('memory.edit')}
      submitLabel={t('common.saveChanges')}
      initial={memory}
      onClose={onClose}
      onSubmit={async (data) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error(t('app.sessionExpired'));
        await updateMemory(token, memory.id, data);
        onUpdated();
      }}
    />
  );
}

export default EditMemory;
