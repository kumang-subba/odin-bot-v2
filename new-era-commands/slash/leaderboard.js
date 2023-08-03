const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config');

axios.default.defaults.headers.get.Authorization = `Token ${config.pointsbot.token}`;

async function displayUserRank(interaction) {
  const user = interaction.options.getUser('name');

  try {
    const response = await axios.get(`https://www.theodinproject.com/api/points/${user.id}`);
    const userPoints = response.data.points !== undefined ? response.data.points : 0;
    const rank = response.data.rank !== undefined ? `${response.data.rank} - ` : '';

    const userRankReply = new EmbedBuilder()
      .setColor('#cc9543')
      .setTitle('Leaderboard')
      .addFields([{ name: 'User Rank', value: `${rank}${user.username} has ${userPoints} point${userPoints === 1 ? '' : 's'}!` }]);

    await interaction.reply({ embeds: [userRankReply] });
  } catch (err) {
    console.log(err.stack);
    console.log('@ new-era-commands/slash/leaderboard.js function displayUserRank()');
  }
}

function getUsersList(users, limit, offset, interaction) {
  let usersList = '';

  for (let i = offset; i < limit + offset; i += 1) {
    const user = users[i];
    if (user) {
      const member = interaction.guild.members.cache.get(user.discord_id);
      const username = member ? member.displayName.replace(/!/g, '!') : 'Unknown';
      if (i === 0) {
        usersList += `${i + 1} - ${username} [${user.points} points] :tada: \n`;
      } else {
        usersList += `${i + 1} - ${username} [${user.points} points] \n`;
      }
    }
  }

  return usersList;
}

async function displayServerRanking(interaction) {
  const limitOption = interaction.options.getInteger('limit');
  const limit = limitOption <= 25 && limitOption > 0 ? limitOption : 25;

  const offsetOption = interaction.options.getInteger('offset');
  const offset = offsetOption != null ? offsetOption : 0;

  try {
    const response = await axios.get('https://www.theodinproject.com/api/points');

    // eslint-disable-next-line max-len
    const users = response.data.filter((user) => interaction.guild.members.cache.get(user.discord_id));
    const usersList = getUsersList(users, limit, offset, interaction);

    const leaderboardReply = new EmbedBuilder()
      .setColor('#cc9543')
      .setTitle('Leaderboard')
      .addFields([{ name: 'Server Ranking', value: usersList || 'Be the first to earn a point!' }]);

    await interaction.reply({ embeds: [leaderboardReply] });
  } catch (err) {
    console.log(err.stack);
    console.log('@ new-era-commands/slash/leaderboard.js function displayLeaderboardRanking()');
  }
}

function getLeaderboardInformation(interaction) {
  if (interaction.options.getSubcommand() === 'user') {
    displayUserRank(interaction);
  } else {
    displayServerRanking(interaction);
  }
}

function userRanking(command) {
  command.setName('user')
    .setDescription('User Ranking')
    .addUserOption((option) => {
      option.setName('name')
        .setDescription("Display user's rank in the leaderboard")
        .setRequired(true);
      return option;
    });

  return command;
}

function serverRanking(command) {
  command.setName('ranking')
    .setDescription('Odin Leaderboard Ranking')
    .addIntegerOption((option) => {
      option.setName('limit')
        .setDescription('Limit the result. Max is 25')
        .setRequired(false);
      return option;
    })
    .addIntegerOption((option) => {
      option.setName('offset')
        .setDescription('Offset is the starting position in the ranking')
        .setRequired(false);
      return option;
    });

  return command;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Placehodler')
    .addSubcommand(userRanking)
    .addSubcommand(serverRanking),
  execute: getLeaderboardInformation,
};
