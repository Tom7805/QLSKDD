package com.qlskdd.specification;

import com.qlskdd.entity.Event;
import com.qlskdd.enums.EventStatus;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class EventSpecification {

	public static Specification<Event> filter(String keyword, Long categoryId, String status,
											  LocalDate from, LocalDate to) {
		return (root, query, cb) -> {
			List<Predicate> predicates = new ArrayList<>();

			if (keyword != null && !keyword.isBlank()) {
				String like = "%" + keyword.trim().toLowerCase() + "%";
				Predicate nameLike = cb.like(cb.lower(root.get("name")), like);
				Predicate locationLike = cb.like(cb.lower(root.get("location")), like);
				Predicate descriptionLike = cb.like(cb.lower(root.get("description")), like);
				predicates.add(cb.or(nameLike, locationLike, descriptionLike));
			}

			if (categoryId != null) {
				predicates.add(cb.equal(root.get("category").get("id"), categoryId));
			}

			if (status != null && !status.isBlank()) {
				try {
					EventStatus st = EventStatus.valueOf(status.trim().toUpperCase());
					predicates.add(cb.equal(root.get("status"), st));
				} catch (IllegalArgumentException ex) {
					// invalid status handled at controller/service level by throwing Bad Request
				}
			}

			if (from != null) {
				LocalDateTime fromDateTime = from.atStartOfDay();
				predicates.add(cb.greaterThanOrEqualTo(root.get("startAt"), fromDateTime));
			}

			if (to != null) {
				LocalDateTime toDateTime = LocalDateTime.of(to, LocalTime.MAX);
				predicates.add(cb.lessThanOrEqualTo(root.get("startAt"), toDateTime));
			}

			return cb.and(predicates.toArray(new Predicate[0]));
		};
	}
}
