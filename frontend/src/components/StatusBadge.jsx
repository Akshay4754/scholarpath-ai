import React from 'react';
export default function StatusBadge({ status, children }) {
  const labels = { potential_match: 'Potential match', needs_review: 'Needs review', not_match: 'Not a match', todo: 'To do', done: 'Complete', in_progress: 'In progress', preparing: 'Preparing', ready_for_review: 'Ready to review', investigating: 'Investigating', waiting_for_user: 'Waiting for you', needs_attention: 'Needs attention', completed: 'Completed' };
  return <span className={`status-badge ${status || ''}`}><i/>{children || labels[status] || status}</span>;
}
