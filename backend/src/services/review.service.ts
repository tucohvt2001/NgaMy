import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { CreateReviewInput, ListReviewsQuery } from '../validators/review.validator';

export const reviewService = {
  // Lấy thông tin công khai của sự kiện cho trang đánh giá khách hàng
  async getPublicEventReviewInfo(eventId: string) {
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { eventCode: eventId },
        ],
      },
      select: {
        id: true,
        eventCode: true,
        name: true,
        eventType: true,
        eventDate: true,
        location: true,
        customerName: true,
        customerPhone: true,
        status: true,
        reviews: {
          select: {
            id: true,
            customerName: true,
            rating: true,
            performanceQuality: true,
            punctuality: true,
            attitude: true,
            comment: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy thông tin sự kiện hoặc đường dẫn không hợp lệ');
    }

    const totalReviews = event.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Math.round((event.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 5.0;

    return {
      event: {
        id: event.id,
        eventCode: event.eventCode,
        name: event.name,
        eventType: event.eventType,
        eventDate: event.eventDate,
        location: event.location,
        customerName: event.customerName,
        customerPhone: event.customerPhone,
      },
      stats: {
        totalReviews,
        avgRating,
      },
      recentReviews: event.reviews.slice(0, 5),
    };
  },

  // Khách hàng gửi đánh giá mới
  async createPublicReview(eventId: string, input: CreateReviewInput) {
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: eventId },
          { eventCode: eventId },
        ],
      },
      select: { id: true, name: true },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện để đánh giá');
    }

    const review = await prisma.eventReview.create({
      data: {
        eventId: event.id,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone?.trim() || null,
        rating: input.rating,
        performanceQuality: input.performanceQuality || null,
        punctuality: input.punctuality || null,
        attitude: input.attitude || null,
        comment: input.comment?.trim() || null,
        isPublic: input.isPublic ?? true,
      },
    });

    return {
      review,
      message: `Đoàn Nghệ Thuật Lân Sư Rồng Nga My Thượng xin chân thành cảm ơn quý khách ${input.customerName}! Sự hài lòng của quý khách là niềm tự hào to lớn của toàn thể anh em trong đoàn. Kính chúc quý khách tài lộc, bình an và vạn sự cát tường!`,
    };
  },

  // Quản trị viên xem danh sách đánh giá toàn CLB
  async listReviews(query: ListReviewsQuery) {
    const { page, limit, eventId, rating, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (eventId) where.eventId = eventId;
    if (rating) where.rating = rating;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { comment: { contains: search, mode: 'insensitive' } },
        { event: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total, allReviews] = await Promise.all([
      prisma.eventReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          event: {
            select: {
              id: true,
              eventCode: true,
              name: true,
              eventType: true,
              eventDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventReview.count({ where }),
      prisma.eventReview.findMany({
        select: { rating: true },
      }),
    ]);

    const totalCount = allReviews.length;
    const avgRating =
      totalCount > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 5.0;

    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: allReviews.filter((r) => r.rating === star).length,
      percentage: totalCount > 0 ? Math.round((allReviews.filter((r) => r.rating === star).length / totalCount) * 100) : 0,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalReviews: totalCount,
        avgRating,
        ratingDistribution,
      },
    };
  },

  // Lấy danh sách đánh giá của 1 sự kiện cụ thể
  async getEventReviews(eventId: string) {
    return prisma.eventReview.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  },
};
