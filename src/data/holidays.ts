export interface UniversityHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'gazetted' | 'state' | 'university';
  description: string;
}

export const INDIAN_NATIONAL_AND_STATE_HOLIDAYS: UniversityHoliday[] = [
  // ================= 2025 =================
  { date: '2025-01-01', name: "New Year's Day", type: 'gazetted', description: 'Celebration of the New Year' },
  { date: '2025-01-14', name: 'Makar Sankranti / Pongal', type: 'gazetted', description: 'Harvest festival across India' },
  { date: '2025-01-26', name: 'Republic Day (National Holiday)', type: 'national', description: 'National Holiday • Enactment of Indian Constitution' },
  { date: '2025-02-26', name: 'Maha Shivratri', type: 'gazetted', description: 'Hindu festival celebrating Lord Shiva' },
  { date: '2025-03-14', name: 'Holi (Festival of Colors)', type: 'gazetted', description: 'Gazetted Holiday • Spring Festival of Colors' },
  { date: '2025-03-31', name: 'Id-ul-Fitr (Eid)', type: 'gazetted', description: 'Gazetted Holiday • Islamic celebration' },
  { date: '2025-04-06', name: 'Ram Navami', type: 'gazetted', description: 'Birth of Lord Rama' },
  { date: '2025-04-10', name: 'Mahavir Jayanti', type: 'gazetted', description: 'Jain festival celebrating Lord Mahavira' },
  { date: '2025-04-14', name: 'Dr. B.R. Ambedkar Jayanti', type: 'gazetted', description: 'Birth anniversary of Babasaheb Ambedkar' },
  { date: '2025-04-18', name: 'Good Friday', type: 'gazetted', description: 'Christian holiday commemorating the crucifixion' },
  { date: '2025-05-12', name: 'Buddha Purnima', type: 'gazetted', description: 'Birth anniversary of Gautam Buddha' },
  { date: '2025-06-07', name: 'Id-ul-Zuha (Bakrid)', type: 'gazetted', description: 'Feast of the Sacrifice' },
  { date: '2025-07-06', name: 'Muharram', type: 'gazetted', description: 'First month of Islamic calendar' },
  { date: '2025-08-15', name: 'Independence Day (National Holiday)', type: 'national', description: 'National Holiday • Indian Independence Day 1947' },
  { date: '2025-08-16', name: 'Janmashtami (Krishna Jayanti)', type: 'gazetted', description: 'Birth of Lord Krishna' },
  { date: '2025-09-23', name: "Haryana Heroes' Martyrdom Day", type: 'state', description: 'Haryana State Holiday honoring martyrs' },
  { date: '2025-10-02', name: 'Mahatma Gandhi Jayanti (National Holiday)', type: 'national', description: 'National Holiday • Birth of Mahatma Gandhi' },
  { date: '2025-10-02', name: 'Dussehra (Vijayadashami)', type: 'gazetted', description: 'Victory of good over evil' },
  { date: '2025-10-20', name: 'Diwali (Deepavali)', type: 'gazetted', description: 'Gazetted Holiday • Festival of Lights' },
  { date: '2025-10-21', name: 'Govardhan Puja & Vishwakarma Day', type: 'university', description: 'SVSU University Special Observance' },
  { date: '2025-11-01', name: 'Haryana Day (State Foundation Day)', type: 'state', description: 'Haryana State Foundation Holiday' },
  { date: '2025-11-05', name: 'Guru Nanak Dev Jayanti', type: 'gazetted', description: 'Birth of Guru Nanak Dev Ji' },
  { date: '2025-12-25', name: 'Christmas Day', type: 'gazetted', description: 'Celebration of the Nativity of Jesus' },

  // ================= 2026 =================
  { date: '2026-01-01', name: "New Year's Day", type: 'gazetted', description: 'First day of the year' },
  { date: '2026-01-14', name: 'Makar Sankranti / Pongal', type: 'gazetted', description: 'Harvest festival & Uttarayan' },
  { date: '2026-01-23', name: 'Netaji Subhash Chandra Bose Jayanti', type: 'state', description: 'Parakram Diwas' },
  { date: '2026-01-26', name: 'Republic Day (National Holiday)', type: 'national', description: 'National Holiday • Celebrates Indian Constitution' },
  { date: '2026-02-15', name: 'Maha Shivratri', type: 'gazetted', description: 'Great Night of Shiva' },
  { date: '2026-03-03', name: 'Holi / Dhulandi (Festival of Colors)', type: 'gazetted', description: 'Gazetted Holiday • Spring Festival' },
  { date: '2026-03-21', name: 'Id-ul-Fitr (Eid)', type: 'gazetted', description: 'Islamic Eid celebration' },
  { date: '2026-03-28', name: 'Ram Navami', type: 'gazetted', description: 'Birth anniversary of Lord Rama' },
  { date: '2026-03-31', name: 'Mahavir Jayanti', type: 'gazetted', description: 'Celebration of Lord Mahavira' },
  { date: '2026-04-03', name: 'Good Friday', type: 'gazetted', description: 'Gazetted Christian Holiday' },
  { date: '2026-04-14', name: 'Dr. B.R. Ambedkar Jayanti', type: 'gazetted', description: 'Birth of Dr. B.R. Ambedkar' },
  { date: '2026-04-20', name: 'Maharshi Parshuram Jayanti', type: 'state', description: 'Haryana State Gazetted Holiday' },
  { date: '2026-05-01', name: "International Workers' Day", type: 'gazetted', description: 'May Day / Labor Day' },
  { date: '2026-05-27', name: 'Id-ul-Zuha (Bakrid)', type: 'gazetted', description: 'Gazetted Islamic Holiday' },
  { date: '2026-05-31', name: 'Buddha Purnima', type: 'gazetted', description: 'Birth anniversary of Gautam Buddha' },
  { date: '2026-06-26', name: 'Muharram', type: 'gazetted', description: 'Islamic New Year period' },
  { date: '2026-08-15', name: 'Independence Day (National Holiday)', type: 'national', description: 'National Holiday • 80th Independence Day' },
  { date: '2026-08-27', name: 'Raksha Bandhan', type: 'gazetted', description: 'Celebration of bond of siblings' },
  { date: '2026-09-04', name: 'Janmashtami (Krishna Janmotsav)', type: 'gazetted', description: 'Birth of Lord Krishna' },
  { date: '2026-09-23', name: "Haryana Heroes' Martyrdom Day", type: 'state', description: 'Haryana State Official Holiday' },
  { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti (National Holiday)', type: 'national', description: 'National Holiday • International Day of Non-Violence' },
  { date: '2026-10-11', name: 'Maharaja Agrasen Jayanti', type: 'state', description: 'Haryana State Gazetted Holiday' },
  { date: '2026-10-20', name: 'Dussehra (Vijayadashami)', type: 'gazetted', description: 'Victory of Good over Evil' },
  { date: '2026-10-26', name: 'Maharishi Valmiki Jayanti', type: 'gazetted', description: 'Birth of Sage Valmiki' },
  { date: '2026-11-01', name: 'Haryana Day (State Foundation Day)', type: 'state', description: 'Haryana Statehood Foundation Day' },
  { date: '2026-11-08', name: 'Diwali (Deepavali)', type: 'gazetted', description: 'National Festival of Lights' },
  { date: '2026-11-09', name: 'Govardhan Puja & Shri Vishwakarma Day', type: 'university', description: 'SVSU University Patron Celebration' },
  { date: '2026-11-10', name: 'Bhai Dooj', type: 'gazetted', description: 'Festival of brother and sister' },
  { date: '2026-11-15', name: 'Chhath Puja', type: 'gazetted', description: 'Sun Worship Festival' },
  { date: '2026-11-24', name: 'Guru Nanak Dev Jayanti (Prakash Parv)', type: 'gazetted', description: 'Birth of Guru Nanak Dev Ji' },
  { date: '2026-12-25', name: 'Christmas Day', type: 'gazetted', description: 'Celebration of Christmas' },
  { date: '2026-12-26', name: 'Shaheed Udham Singh Jayanti', type: 'state', description: 'Haryana State Martyr Observance' },

  // ================= 2027 =================
  { date: '2027-01-01', name: "New Year's Day", type: 'gazetted', description: 'First day of the year 2027' },
  { date: '2027-01-14', name: 'Makar Sankranti / Pongal', type: 'gazetted', description: 'Harvest festival' },
  { date: '2027-01-26', name: 'Republic Day (National Holiday)', type: 'national', description: 'National Holiday • Indian Republic Day' },
  { date: '2027-03-07', name: 'Maha Shivratri', type: 'gazetted', description: 'Hindu holiday celebrating Lord Shiva' },
  { date: '2027-03-10', name: 'Id-ul-Fitr (Eid)', type: 'gazetted', description: 'Eid celebration' },
  { date: '2027-03-23', name: 'Holi (Festival of Colors)', type: 'gazetted', description: 'Gazetted Holiday' },
  { date: '2027-04-14', name: 'Dr. B.R. Ambedkar Jayanti', type: 'gazetted', description: 'Birth of Babasaheb Ambedkar' },
  { date: '2027-04-16', name: 'Ram Navami', type: 'gazetted', description: 'Birth of Lord Rama' },
  { date: '2027-04-23', name: 'Good Friday', type: 'gazetted', description: 'Good Friday holiday' },
  { date: '2027-05-20', name: 'Buddha Purnima', type: 'gazetted', description: 'Birth of Gautam Buddha' },
  { date: '2027-08-15', name: 'Independence Day (National Holiday)', type: 'national', description: 'National Holiday • Indian Independence' },
  { date: '2027-08-25', name: 'Janmashtami', type: 'gazetted', description: 'Birth of Lord Krishna' },
  { date: '2027-09-23', name: "Haryana Heroes' Martyrdom Day", type: 'state', description: 'Haryana State Official Holiday' },
  { date: '2027-10-02', name: 'Mahatma Gandhi Jayanti (National Holiday)', type: 'national', description: 'National Holiday' },
  { date: '2027-10-09', name: 'Dussehra (Vijayadashami)', type: 'gazetted', description: 'Victory of truth' },
  { date: '2027-10-29', name: 'Diwali (Deepavali)', type: 'gazetted', description: 'Festival of Lights' },
  { date: '2027-10-30', name: 'Govardhan Puja & Vishwakarma Day', type: 'university', description: 'SVSU University Special Observance' },
  { date: '2027-11-01', name: 'Haryana Day', type: 'state', description: 'Haryana State Foundation Day' },
  { date: '2027-11-14', name: 'Guru Nanak Jayanti', type: 'gazetted', description: 'Prakash Parv' },
  { date: '2027-12-25', name: 'Christmas Day', type: 'gazetted', description: 'Celebration of Christmas' }
];

export const getHolidayForDate = (dateStr: string): UniversityHoliday | undefined => {
  return INDIAN_NATIONAL_AND_STATE_HOLIDAYS.find(h => h.date === dateStr);
};
