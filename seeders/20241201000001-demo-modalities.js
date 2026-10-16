'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'modalities',
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Yoga',
          slug: 'yoga',
          description:
            'A group of physical, mental, and spiritual practices or disciplines which originated in ancient India.',
          iconUrl: 'https://example.com/icons/yoga.png',
          status: '1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Pilates',
          slug: 'pilates',
          description: 'A physical fitness system developed in the early 20th century by Joseph Pilates.',
          iconUrl: 'https://example.com/icons/pilates.png',
          status: '1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Meditation',
          slug: 'meditation',
          description:
            'A practice where an individual uses a technique to achieve a mentally clear and emotionally calm state.',
          iconUrl: 'https://example.com/icons/meditation.png',
          status: '1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Tai Chi',
          slug: 'tai-chi',
          description:
            'An internal Chinese martial art practiced for both its defense training and its health benefits.',
          iconUrl: 'https://example.com/icons/tai-chi.png',
          status: '1'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          name: 'Dance',
          slug: 'dance',
          description: 'A performing art form consisting of purposefully selected sequences of human movement.',
          iconUrl: 'https://example.com/icons/dance.png',
          status: '1'
        }
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('modalities', null, {});
  }
};
