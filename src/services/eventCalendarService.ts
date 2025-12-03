/**
 * 文化主题活动日历服务 - 提供活动日历相关功能
 */

// 活动类型定义
export type EventType = 'theme' | 'collaboration' | 'competition' | 'workshop' | 'exhibition';

// 活动状态类型
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

// 文化主题活动接口
export interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  onlineLink?: string;
  organizer: string;
  image: string;
  tags: string[];
  culturalElements: string[];
  participantCount: number;
  maxParticipants?: number;
  registrationDeadline?: string;
  hasPrize: boolean;
  prizeDescription?: string;
  rules?: string[];
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

// 活动参与记录接口
export interface EventParticipation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  registeredAt: string;
  status: 'registered' | 'submitted' | 'completed' | 'winner';
  submissionId?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submissionImage?: string;
  ranking?: number;
}

// 活动日历服务类
class EventCalendarService {
  // 本地存储键名
  private EVENTS_KEY = 'jmzf_cultural_events';
  private PARTICIPATIONS_KEY = 'jmzf_event_participations';
  private USER_EVENTS_KEY = 'jmzf_user_events';

  // 模拟数据
  private events: CulturalEvent[] = [
    {
      id: 'event-001',
      title: '国潮文化创意设计大赛',
      description: '融合传统中国文化元素与现代设计风格的创意设计大赛',
      type: 'competition',
      status: 'upcoming',
      startDate: '2025-12-15',
      endDate: '2026-01-31',
      startTime: '00:00',
      endTime: '23:59',
      organizer: '津脉智坊',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20cultural%20creative%20design%20competition%20banner',
      tags: ['国潮', '设计', '大赛'],
      culturalElements: ['中国传统纹样', '中国传统色彩', '传统工艺'],
      participantCount: 128,
      maxParticipants: 500,
      registrationDeadline: '2026-01-15',
      hasPrize: true,
      prizeDescription: '一等奖1名：10000元现金 + 荣誉证书\n二等奖3名：5000元现金 + 荣誉证书\n三等奖5名：2000元现金 + 荣誉证书\n优秀奖10名：荣誉证书',
      rules: [
        '参赛作品必须为原创，未侵犯他人知识产权',
        '作品需融合至少一种中国传统元素',
        '每人最多可提交3件作品',
        '提交格式为PNG、JPG或SVG',
        '作品分辨率不低于1920x1080'
      ],
      requirements: [
        '提交作品设计说明（100-500字）',
        '说明作品中使用的文化元素及其来源',
        '提供作品创作过程（可选）'
      ],
      createdAt: '2025-11-01T00:00:00.000Z',
      updatedAt: '2025-11-10T00:00:00.000Z'
    },
    {
      id: 'event-002',
      title: '天津文化创意工作坊',
      description: '学习天津传统文化元素，创作具有天津特色的创意作品',
      type: 'workshop',
      status: 'ongoing',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
      startTime: '14:00',
      endTime: '17:00',
      location: '天津市和平区文化中心',
      organizer: '天津文化创意产业协会',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Tianjin%20cultural%20creative%20workshop%20banner',
      tags: ['天津', '文化', '工作坊'],
      culturalElements: ['杨柳青年画', '泥人张', '天津方言', '天津小吃'],
      participantCount: 45,
      maxParticipants: 100,
      registrationDeadline: '2025-12-20',
      hasPrize: false,
      createdAt: '2025-10-15T00:00:00.000Z',
      updatedAt: '2025-11-05T00:00:00.000Z'
    },
    {
      id: 'event-003',
      title: '非遗文化数字创意展',
      description: '展示非遗文化的数字创意作品，推动非遗文化的传承与创新',
      type: 'exhibition',
      status: 'upcoming',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      onlineLink: 'https://exhibition.example.com',
      organizer: '中国非遗保护中心',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20cultural%20heritage%20digital%20exhibition%20banner',
      tags: ['非遗', '数字创意', '展览'],
      culturalElements: ['非遗', '传统工艺', '民族文化'],
      participantCount: 0,
      hasPrize: false,
      createdAt: '2025-11-20T00:00:00.000Z',
      updatedAt: '2025-11-20T00:00:00.000Z'
    },
    {
      id: 'event-004',
      title: '传统文化元素AI共创活动',
      description: '使用AI工具创作融合传统文化元素的作品',
      type: 'collaboration',
      status: 'completed',
      startDate: '2025-09-01',
      endDate: '2025-10-31',
      startTime: '00:00',
      endTime: '23:59',
      onlineLink: 'https://collab.example.com',
      organizer: '津脉智坊',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20culture%20AI%20collaboration%20event%20banner',
      tags: ['AI', '共创', '传统文化'],
      culturalElements: ['中国传统纹样', '书法', '国画', '传统色彩'],
      participantCount: 234,
      hasPrize: true,
      prizeDescription: '优秀作品将获得AI创作工具免费使用权限',
      createdAt: '2025-08-15T00:00:00.000Z',
      updatedAt: '2025-10-31T00:00:00.000Z'
    }
  ];

  // 模拟参与记录数据
  private participations: EventParticipation[] = [];

  constructor() {
    // 初始化时从本地存储加载数据
    this.loadData();
  }

  // 加载数据
  private loadData(): void {
    try {
      const eventsRaw = localStorage.getItem(this.EVENTS_KEY);
      if (eventsRaw) {
        this.events = JSON.parse(eventsRaw);
      }

      const participationsRaw = localStorage.getItem(this.PARTICIPATIONS_KEY);
      if (participationsRaw) {
        this.participations = JSON.parse(participationsRaw);
      }
    } catch (error) {
      console.error('Failed to load event data:', error);
    }
  }

  // 保存活动数据
  private saveEvents(): void {
    try {
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  // 保存参与记录数据
  private saveParticipations(): void {
    try {
      localStorage.setItem(this.PARTICIPATIONS_KEY, JSON.stringify(this.participations));
    } catch (error) {
      console.error('Failed to save participations:', error);
    }
  }

  /**
   * 获取所有文化主题活动
   */
  getAllEvents(): CulturalEvent[] {
    return [...this.events];
  }

  /**
   * 根据ID获取单个活动
   */
  getEventById(id: string): CulturalEvent | undefined {
    return this.events.find(event => event.id === id);
  }

  /**
   * 根据状态获取活动
   */
  getEventsByStatus(status: EventStatus): CulturalEvent[] {
    return this.events.filter(event => event.status === status);
  }

  /**
   * 根据类型获取活动
   */
  getEventsByType(type: EventType): CulturalEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * 获取即将开始的活动
   */
  getUpcomingEvents(limit?: number): CulturalEvent[] {
    const now = new Date();
    return this.events
      .filter(event => event.status === 'upcoming' || event.status === 'ongoing')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }

  /**
   * 获取最近结束的活动
   */
  getRecentCompletedEvents(limit?: number): CulturalEvent[] {
    return this.events
      .filter(event => event.status === 'completed')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, limit);
  }

  /**
   * 根据文化元素获取活动
   */
  getEventsByCulturalElement(element: string): CulturalEvent[] {
    return this.events.filter(event => event.culturalElements.includes(element));
  }

  /**
   * 根据标签获取活动
   */
  getEventsByTag(tag: string): CulturalEvent[] {
    return this.events.filter(event => event.tags.includes(tag));
  }

  /**
   * 搜索活动
   */
  searchEvents(keyword: string): CulturalEvent[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.events.filter(event => 
      event.title.toLowerCase().includes(lowerKeyword) ||
      event.description.toLowerCase().includes(lowerKeyword) ||
      event.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      event.culturalElements.some(element => element.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 创建新活动
   */
  createEvent(event: Omit<CulturalEvent, 'id' | 'participantCount' | 'createdAt' | 'updatedAt'>): CulturalEvent {
    const newEvent: CulturalEvent = {
      ...event,
      id: `event-${Date.now()}`,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  /**
   * 更新活动信息
   */
  updateEvent(id: string, updates: Partial<Omit<CulturalEvent, 'id' | 'createdAt'>>): boolean {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) {
      return false;
    }

    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveEvents();
    return true;
  }

  /**
   * 注册参加活动
   */
  registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userAvatar: string
  ): EventParticipation {
    const event = this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // 检查是否已达到最大参与人数
    if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    // 检查是否已注册
    const existingParticipation = this.participations.find(
      p => p.eventId === eventId && p.userId === userId
    );

    if (existingParticipation) {
      return existingParticipation;
    }

    const participation: EventParticipation = {
      id: `participation-${Date.now()}`,
      eventId,
      userId,
      userName,
      userAvatar,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    };

    this.participations.push(participation);
    this.saveParticipations();

    // 更新活动参与人数
    this.updateEvent(eventId, { participantCount: event.participantCount + 1 });

    return participation;
  }

  /**
   * 提交活动作品
   */
  submitEventWork(
    participationId: string,
    workId: string,
    title: string,
    description: string,
    image: string
  ): boolean {
    const index = this.participations.findIndex(p => p.id === participationId);
    if (index === -1) {
      return false;
    }

    this.participations[index] = {
      ...this.participations[index],
      status: 'submitted',
      submissionId: workId,
      submissionTitle: title,
      submissionDescription: description,
      submissionImage: image
    };

    this.saveParticipations();
    return true;
  }

  /**
   * 获取活动参与记录
   */
  getEventParticipations(eventId: string): EventParticipation[] {
    return this.participations.filter(p => p.eventId === eventId);
  }

  /**
   * 获取用户的活动参与记录
   */
  getUserParticipations(userId: string): EventParticipation[] {
    return this.participations.filter(p => p.userId === userId);
  }

  /**
   * 获取活动统计信息
   */
  getEventStats(): {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    totalParticipants: number;
    averageParticipantsPerEvent: number;
    eventsByType: Record<EventType, number>;
  } {
    const totalEvents = this.events.length;
    const upcomingEvents = this.events.filter(e => e.status === 'upcoming').length;
    const ongoingEvents = this.events.filter(e => e.status === 'ongoing').length;
    const completedEvents = this.events.filter(e => e.status === 'completed').length;
    const totalParticipants = this.participations.length;
    const averageParticipantsPerEvent = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    
    const eventsByType: Record<EventType, number> = {
      theme: this.events.filter(e => e.type === 'theme').length,
      collaboration: this.events.filter(e => e.type === 'collaboration').length,
      competition: this.events.filter(e => e.type === 'competition').length,
      workshop: this.events.filter(e => e.type === 'workshop').length,
      exhibition: this.events.filter(e => e.type === 'exhibition').length
    };

    return {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
      averageParticipantsPerEvent,
      eventsByType
    };
  }
}

// 导出单例实例
export default new EventCalendarService();
