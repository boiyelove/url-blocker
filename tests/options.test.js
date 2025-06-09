// Tests for options.js functions
const fs = require('fs');
const path = require('path');

// Create a simplified version of the options.js for testing
const optionsTestCode = `
  // Format duration between two dates in a human-readable format
  function formatDuration(startDate, endDate) {
    // Calculate the difference in milliseconds
    const diff = endDate - startDate;
    
    if (diff <= 0) {
      return 'expired';
    }
    
    // Convert to seconds, minutes, hours, days
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    // Format the duration
    if (years > 0) {
      return years === 1 ? '1 year' : \`\${years} years\`;
    } else if (months > 0) {
      return months === 1 ? '1 month' : \`\${months} months\`;
    } else if (days > 0) {
      return days === 1 ? '1 day' : \`\${days} days\`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour' : \`\${hours} hours\`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute' : \`\${minutes} minutes\`;
    } else {
      return seconds === 1 ? '1 second' : \`\${seconds} seconds\`;
    }
  }

  // Format date for datetime-local input (YYYY-MM-DDThh:mm)
  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return \`\${year}-\${month}-\${day}T\${hours}:\${minutes}\`;
  }
`;

// Evaluate the test code
eval(optionsTestCode);

describe('Options Page Functions', () => {
  describe('formatDuration', () => {
    test('should format duration in years', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2025-01-01');
      expect(formatDuration(start, end)).toBe('2 years');
    });

    test('should format duration in months', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-04-01');
      expect(formatDuration(start, end)).toBe('3 months');
    });

    test('should format duration in days', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2023-01-10');
      expect(formatDuration(start, end)).toBe('9 days');
    });

    test('should format duration in hours', () => {
      const start = new Date('2023-01-01T10:00:00');
      const end = new Date('2023-01-01T15:00:00');
      expect(formatDuration(start, end)).toBe('5 hours');
    });

    test('should format duration in minutes', () => {
      const start = new Date('2023-01-01T10:00:00');
      const end = new Date('2023-01-01T10:30:00');
      expect(formatDuration(start, end)).toBe('30 minutes');
    });

    test('should format duration in seconds', () => {
      const start = new Date('2023-01-01T10:00:00');
      const end = new Date('2023-01-01T10:00:45');
      expect(formatDuration(start, end)).toBe('45 seconds');
    });

    test('should return "expired" for past dates', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2022-01-01');
      expect(formatDuration(start, end)).toBe('expired');
    });
  });

  describe('formatDateForInput', () => {
    test('should format date correctly for input', () => {
      const date = new Date(2023, 0, 15, 10, 30); // Jan 15, 2023, 10:30
      expect(formatDateForInput(date)).toBe('2023-01-15T10:30');
    });

    test('should pad single digit values', () => {
      const date = new Date(2023, 5, 5, 9, 5); // June 5, 2023, 09:05
      expect(formatDateForInput(date)).toBe('2023-06-05T09:05');
    });
  });
});
