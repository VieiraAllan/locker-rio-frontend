import { useState } from 'react';

function useToast() {
  const [toast, setToast] = useState({
    message: '',
    type: 'success'
  });

  function showToast(message, type = 'success') {
    setToast({ message, type });

    // Auto-dismiss após 3s
    setTimeout(() => {
      setToast({ message: '', type: 'success' });
    }, 3000);
  }

  function clearToast() {
    setToast({ message: '', type: 'success' });
  }

  return {
    toast,
    showToast,
    clearToast
  };
}

export default useToast;