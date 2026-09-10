import MemoryForm from './MemoryForm';
import { createMemory } from './api';
import { t, useT } from './i18n';

function AddMemory({ onClose, onCreated }) {
  useT(); // 订阅语言：切换语言时弹窗标题/按钮跟着变
  return (
    <MemoryForm
      heading={t('memory.add')}
      submitLabel={t('common.save')}
      initial={null}
      onClose={onClose}
      onSubmit={async (data) => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error(t('app.sessionExpired'));
        await createMemory(token, data);
        onCreated();
      }}
    />
  );
}

export default AddMemory;
