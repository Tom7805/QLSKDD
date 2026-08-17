import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface SortableBlock {
  id: string;
  /** Tên thẻ, dùng cho nhãn trợ năng của tay cầm kéo */
  title: string;
  /** Lớp bố cục của ô lưới (vd 'xl:col-span-2') — bề rộng đi theo thẻ khi đổi chỗ */
  className?: string;
  content: ReactNode;
}

interface SortableGridProps {
  /** Khoá localStorage để nhớ thứ tự người dùng đã sắp */
  storageKey: string;
  blocks: SortableBlock[];
  className?: string;
  ariaLabel: string;
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 10" className="h-2.5 w-4" aria-hidden="true" fill="currentColor">
      <circle cx="3" cy="3" r="1.3" /><circle cx="8" cy="3" r="1.3" /><circle cx="13" cy="3" r="1.3" />
      <circle cx="3" cy="7" r="1.3" /><circle cx="8" cy="7" r="1.3" /><circle cx="13" cy="7" r="1.3" />
    </svg>
  );
}

/**
 * Đọc thứ tự đã lưu, bỏ những id không còn tồn tại và nối thêm những id mới xuất hiện.
 * Không tin tưởng dữ liệu trong localStorage: nó có thể được ghi từ một phiên bản trước
 * khi danh sách thẻ còn khác.
 */
function readOrder(storageKey: string, ids: string[]) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return ids;
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return ids;
    const kept = saved.filter((id): id is string => typeof id === 'string' && ids.includes(id));
    return [...kept, ...ids.filter((id) => !kept.includes(id))];
  } catch {
    return ids;
  }
}

/**
 * Lưới thẻ đổi chỗ được: kéo tay cầm ở mép trên thẻ để đưa nó sang vị trí khác, hoặc
 * focus vào tay cầm rồi bấm phím mũi tên.
 *
 * Bề rộng (`className`) đi THEO thẻ chứ không thuộc về ô lưới, nên các thẻ được thiết kế
 * sao cho tổng bề rộng luôn khớp một hàng dù xếp theo thứ tự nào.
 *
 * Có bàn phím chứ không chỉ kéo thả: kéo thả bằng chuột là thao tác không ai dùng được
 * bằng bàn phím, mà đây lại là cách duy nhất để sắp lại bố cục.
 */
export default function SortableGrid({ storageKey, blocks, className = '', ariaLabel }: SortableGridProps) {
  const ids = blocks.map((block) => block.id);
  const idsKey = ids.join('|');

  const [order, setOrder] = useState<string[]>(() => readOrder(storageKey, ids));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  // Danh sách thẻ đổi (vd đổi quyền, thêm thẻ mới) thì hoà lại thứ tự cũ với danh sách mới
  useEffect(() => {
    setOrder((current) => {
      const kept = current.filter((id) => ids.includes(id));
      return [...kept, ...ids.filter((id) => !kept.includes(id))];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — bố cục chỉ là tuỳ biến hiển
      // thị nên không lưu được cũng không sao, tuyệt đối không làm hỏng cả trang
    }
  }, [order, storageKey]);

  const moveTo = (id: string, targetIndex: number) => {
    setOrder((current) => {
      const from = current.indexOf(id);
      if (from < 0 || targetIndex < 0 || targetIndex >= current.length || from === targetIndex) return current;
      const next = [...current];
      next.splice(from, 1);
      next.splice(targetIndex, 0, id);
      return next;
    });
  };

  const ordered = order
    .map((id) => blocks.find((block) => block.id === id))
    .filter((block): block is SortableBlock => block !== undefined);

  return (
    <div role="list" aria-label={ariaLabel} className={className}>
      {ordered.map((block, index) => {
        const isDragging = draggingId === block.id;
        const isOver = overId === block.id && draggingId !== null && !isDragging;

        return (
          <div
            key={block.id}
            role="listitem"
            ref={(element) => {
              if (element) cardRefs.current.set(block.id, element);
              else cardRefs.current.delete(block.id);
            }}
            onDragOver={(event) => {
              if (!draggingId) return;
              event.preventDefault();
              setOverId(block.id);
            }}
            onDragLeave={() => setOverId((current) => (current === block.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              if (draggingId) moveTo(draggingId, index);
              setDraggingId(null);
              setOverId(null);
            }}
            className={[
              'group/card relative transition-all duration-200',
              block.className ?? '',
              isDragging ? 'scale-[0.98] opacity-40' : '',
              isOver ? 'scale-[1.01]' : '',
            ].join(' ')}
          >
            {isOver && (
              <span
                className="pointer-events-none absolute -inset-1.5 rounded-[26px] border-2 border-dashed border-indigo-400"
                aria-hidden="true"
              />
            )}

            {block.content}

            <button
              type="button"
              draggable
              aria-label={`Đổi vị trí thẻ ${block.title}. Dùng phím mũi tên để chuyển chỗ.`}
              title="Kéo để đổi vị trí"
              onDragStart={(event) => {
                setDraggingId(block.id);
                event.dataTransfer.effectAllowed = 'move';
                // Kéo cả thẻ làm ảnh xem trước thay vì mỗi cái tay cầm bé xíu
                const card = cardRefs.current.get(block.id);
                if (card && typeof event.dataTransfer.setDragImage === 'function') {
                  event.dataTransfer.setDragImage(card, card.offsetWidth / 2, 24);
                }
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setOverId(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  moveTo(block.id, index - 1);
                } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  moveTo(block.id, index + 1);
                }
              }}
              className={[
                'absolute -top-2 left-1/2 z-10 flex h-5 w-9 -translate-x-1/2 cursor-grab items-center justify-center',
                'rounded-full bg-white text-slate-400 shadow-[0_4px_12px_-4px_rgba(49,46,129,0.5)]',
                'opacity-0 transition-all duration-150 hover:text-ink active:cursor-grabbing',
                'group-hover/card:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              ].join(' ')}
            >
              <GripIcon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
