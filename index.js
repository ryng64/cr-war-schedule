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
    .fetch(botChannelID)
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

  //get active members
  const activeMembers = await fetch(
    `https://api.clashroyale.com/v1/clans/%23${clanTag}`,
    {
      method: "GET",
      headers: new Headers({
        Authorization: `Bearer ${process.env.CRTOKEN}`,
      }),
    }
  )
    .then((response) => response.json())
    .then((data) => data.memberList.map((member) => member.tag))
    .catch((error) => error);

  // find all decks used
  const missedDecks = data.clan.participants.filter((participant) => {
    if (
      participant.decksUsedToday < 4 &&
      participant.decksUsedToday > 0 &&
      activeMembers.includes(participant.tag)
    )
      return true;
  });

  const missedDays = data.clan.participants.filter((participant) => {
    if (
      participant.decksUsedToday == 0 &&
      activeMembers.includes(participant.tag)
    )
      return true;
  });

  return { missedDecks, missedDays };
}

//creates an discord embed message for both missed Decks and missed Days
function makeMissedEmbed(missed) {
  let missedValue = "";
  let missedDecks = "";
  if (Array.isArray(missed.missedDecks) && missed.missedDecks.length > 0) {
    missedValue = missed.missedDecks
      .sort((a, b) => {
        if (a.decksUsedToday > b.decksUsedToday) return 1;
        else if (a.decksUsedToday < b.decksUsedToday) return -1;
        else return 0;
      })
      .map((md) => `${md.name}: ${4 - md.decksUsedToday}`)
      .join("\n");
    missedDecks = {
      name: "Attacks remaining",
      value: missedValue,
      inline: false,
    };
  } else {
    missedDecks = {
      name: "Attacks remaining",
      value: "No remaining attacks",
      inline: false,
    };
  }

  const missedDeckEmbed = new MessageEmbed()
    .setColor("#ffeb3b")
    .setTitle("War Day | Attack(s) Remaining")
    .setThumbnail(
      "https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/250?cb=20180425130200"
    )
    .setDescription("Players with remaining decks.")
    .addFields(missedDecks)
    .setTimestamp()
    .setFooter({
      text: `${
        missedDecks.value == "No remaining attacks"
          ? "No missed Decks"
          : "please make all decks 🙏"
      }`,
    });

  let missedDayValue = "";
  let missedDays = "";
  if (Array.isArray(missed.missedDays) && missed.missedDays.length > 0) {
    missedDayValue = missed.missedDays.map((md) => `${md.name}: 4`).join("\n");
    missedDays = {
      name: "All attacks remaining",
      value: missedDayValue,
      inline: false,
    };
  } else {
    missedDays = {
      name: "All Attacks remaining",
      value: "No members missed all attacks! 🎉",
      inline: false,
    };
  }

  const missedDaysEmbed = new MessageEmbed()
    .setColor("#d32f2f")
    .setTitle("War Day | Day Missed")
    .setThumbnail(
      "https://static.wikia.nocookie.net/clashroyale/images/9/9f/War_Shield.png/revision/latest/scale-to-width-down/250?cb=20180425130200"
    )
    .setDescription("Players with all attacks remaining.")
    .addFields(missedDays)
    .setTimestamp()
    .setFooter({
      text: `${
        missedDays.value == "No members missed all attacks! 🎉"
          ? "No Complete misses!"
          : "please make all decks 🙏 Warnings may be issued unless excused ⚠"
      }`,
    });

  return { missedDeckEmbed, missedDaysEmbed };
}
