import fetch, { Headers } from "node-fetch";
import Discord, { MessageEmbed } from "discord.js";
import express from "express";
import "dotenv/config";

const clanTag = "QYJLG9P9";
const botChannelID = "994007661290987540";
const testChannel = "994093588445143164";

const client = new Discord.Client({
  intents: ["GUILDS", "GUILD_MESSAGES"],
});

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log("Missed Wars Schedule Running");
  const channel = await client.channels
    //fetch different channel id for appropriate channel.
    .fetch(testChannel)
    .then((channel) => channel)
    .catch(console.error);
  const missed = await getMissedWar();
  const missedEmbeds = makeMissedEmbed(missed);
  channel.send({
    embeds: [missedEmbeds.missedDeckEmbed, missedEmbeds.missedDaysEmbed],
  });

  setInterval(() => {
    process.exit(1);
  }, 10000);
});

client.login(process.env.DISCORDDEV);

async function getMissedWar() {
  const data = await fetch(
    `https://api.clashroyale.com/v1/clans/%23${clanTag}/currentriverrace`,
    {
      method: "GET",
      headers: new Headers({
        Authorization: `Bearer ${process.env.CRTOKEN}`,
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => data)
    .catch((error) => error);

  // find all decks used
  // console.log("data", data);
  const missedDecks = data.clan.participants.filter((participant) => {
    if (participant.decksUsedToday < 4 && participant.decksUsedToday > 0)
      return true;
  });

  const missedDays = data.clan.participants.filter((participant) => {
    if (participant.decksUsedToday == 0) return true;
  });

  return { missedDecks, missedDays };
}

//creates an discord embed message for both missed Decks and missed Days
function makeMissedEmbed(missed) {
  const missedDecks = missed.missedDecks.map((md) => {
    return {
      name: `${md.tag} - ${md.name}`,
      value: `missed ${4 - md.decksUsedToday} deck(s)`,
      inline: false,
    };
  });
  const missedDeckEmbed = new MessageEmbed()
    .setColor("#ffeb3b")
    .setTitle("Decks Missed")
    .setThumbnail(
      "https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/250?cb=20180425130200"
    )
    .setDescription("less than 4 war decks were played")
    .addFields(missedDecks)
    .setTimestamp()
    .setFooter({ text: `please make all decks 🙏` });
  const missedDays = missed.missedDays.map((md) => {
    return {
      name: `${md.tag} - ${md.name}`,
      value: `missed ${4 - md.decksUsedToday} decks`,
      inline: false,
    };
  });
  const missedDaysEmbed = new MessageEmbed()
    .setColor("#d32f2f")
    .setTitle("Day Missed")
    .setThumbnail(
      "https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/250?cb=20180425130200"
    )
    .setDescription("Missed all 4 decks")
    .addFields(missedDays)
    .setTimestamp()
    .setFooter({ text: `please make all decks 🙏 Warnings may be issued ⚠` });

  return { missedDeckEmbed, missedDaysEmbed };
}
