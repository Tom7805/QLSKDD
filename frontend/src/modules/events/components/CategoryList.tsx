import type { Category } from '../../categories/categoriesTypes';
import FilterChip from './FilterChip';
import { categoryDotClass } from './calendarShared';

interface CategoryListProps {
  categories: Category[];
  /** '' = đang xem tất cả các loại */
  value: string;
  onChange: (categoryId: string) => void;
  categoryOrder?: Map<number, number>;
}

/**
 * Dải chip lọc theo loại sự kiện. Chấm màu của mỗi chip lấy chung nguồn với thanh sự kiện
 * trên lịch (categoryDotClass) nên nhìn chip là biết loại đó hiện màu gì trên bảng.
 */
export default function CategoryList({ categories, value, onChange, categoryOrder }: CategoryListProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo loại sự kiện">
      <FilterChip selected={value === ''} onClick={() => onChange('')}>
        Tất cả loại
      </FilterChip>

      {categories.map((category) => {
        const selected = value === String(category.id);
        return (
          <FilterChip
            key={category.id}
            selected={selected}
            dot={categoryDotClass(category.id, categoryOrder)}
            onClick={() => onChange(selected ? '' : String(category.id))}
          >
            {category.name}
          </FilterChip>
        );
      })}
    </div>
  );
}
