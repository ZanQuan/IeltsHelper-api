export interface NavItem {
  to: string;
  label: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const HOME_ITEM: NavItem = { to: '/dashboard', label: 'Trang chủ' };

export function buildNavGroups(role?: string): NavGroup[] {
  return [
    {
      id: 'class',
      label: 'Lớp học',
      items: [
        { to: '/courses', label: 'Khóa học' },
        { to: '/online', label: 'Học Online' },
        { to: '/assignments', label: 'Bài tập' },
        { to: '/lessons', label: 'Buổi học' },
        { to: '/teacher', label: role === 'Student' ? 'Giáo viên' : 'Học viên' },
      ],
    },
    {
      id: 'practice',
      label: 'Luyện thi',
      items: [
        { to: '/tests', label: 'Listening & Reading' },
        { to: '/writing', label: 'Writing' },
        { to: '/speaking', label: 'Speaking' },
      ],
    },
    {
      id: 'notebook',
      label: 'Sổ tay',
      items: [
        { to: '/vocabulary', label: 'Từ vựng' },
        { to: '/errors', label: 'Lỗi sai' },
      ],
    },
  ];
}