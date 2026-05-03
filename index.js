require('dotenv').config({ path: './.env' });

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require("fs");

console.log("TOKEN cargado:", process.env.TOKEN ? "OK" : "NO");

if (!process.env.TOKEN) {
  console.error("❌ No se encontró el TOKEN en .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

const CHANNEL_ID = "1500509637441753189";

const categories = {
  colores: {
    rojo: ["1500506393982009486","1500506423216570380","1500506457588633752","1500506484902199356","1500506513050042428"],
    naranja: ["1500506136095227984","1500506201782353950","1500506237790585033","1500506279171588248","1500506313879191736"],
    amarillo: ["1500506647418896494","1500506681698943069","1500506715475411084","1500506747431948340","1500506781263073431"],
    verde: ["1500506834023350433","1500506869217759452","1500506895809511506","1500506934841835520","1500506967565799625"],
    azul: ["1500507030094479491","1500507056011218954","1500507106498056234","1500507135740481616","1500507165092352120"],
    violeta: ["1500507232096227328","1500507271573274714","1500507321258737965","1500507369111556308","1500507402846470215"],
    rosa: ["1500507503518286007","1500507550293033140","1500507591141232712","1500507631813525504","1500507675052474599"],
    neutro: ["1500507750004817970","1500507838462824728","1500507782326128732"]
  }
};

const allRoles = Object.values(categories.colores).flat();

['./users.json', './data.json'].forEach(file => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
});

const HEX_COLORS = {
  rojo: { hex: '#E53935', emoji: '🔴', name: 'Rojo' },
  naranja: { hex: '#FF9800', emoji: '🟠', name: 'Naranja' },
  amarillo: { hex: '#FBC02D', emoji: '🟡', name: 'Amarillo' },
  verde: { hex: '#4CAF50', emoji: '🟢', name: 'Verde' },
  azul: { hex: '#2196F3', emoji: '🔵', name: 'Azul' },
  violeta: { hex: '#9C27B0', emoji: '🟣', name: 'Violeta' },
  rosa: { hex: '#E91E63', emoji: '🌸', name: 'Rosa' },
  neutro: { hex: '#757575', emoji: '⚫', name: 'Neutro' }
};

const TONO_NAMES = {
  rojo: ['Cherry', 'Lava', 'Coral', 'Blush', 'RojoOscuro'],
  naranja: ['Flame Orange', 'Caramel', 'Amber', 'Peach', 'Tangerine'],
  amarillo: ['Gold', 'Peach', 'Mostaza', 'StrawGold', 'Lemon'],
  verde: ['Lime', 'Mint', 'Sage', 'Forest', 'Neon'],
  azul: ['Sky', 'Force', 'Steel', 'Alice', 'Bright'],
  violeta: ['Amethyst', 'Lavender', 'Violets', 'Royal', 'Dusty'],
  rosa: ['Blush', 'Cerise', 'Cherry', 'Crimson', 'Raspberry'],
  neutro: ['White', 'Gray', 'Black']
};

const cooldowns = new Map();
const COOLDOWN_TIME = 2000;

// ================== FILE HANDLING ==================

function loadUsers() {
  try { return JSON.parse(fs.readFileSync("./users.json")); } catch { return {}; }
}
function saveUsers(data) {
  fs.writeFileSync("./users.json", JSON.stringify(data, null, 2));
}

function loadData() {
  try { return JSON.parse(fs.readFileSync("./data.json")); } catch { return {}; }
}
function saveData(data) {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

// ================== EMBEDS ==================

function mainEmbed() {
  return new EmbedBuilder()
    .setTitle("🎨 **Selector de Colores**")
    .setDescription(
      "```css\n" +
      "Elige tu color favorito\n" +
      "1. Haz clic en un color\n" +
      "2. Elige tu tono\n" +
      "✨ Rol asignado automáticamente\n" +
      "```"
    )
    .setColor('#E53935');
}

function shadeEmbed(colorName) {
  const config = HEX_COLORS[colorName];
  return new EmbedBuilder()
    .setTitle(config.emoji + " **" + config.name.toUpperCase() + "**")
    .setDescription("**Selecciona un tono:**")
    .setColor(config.hex)
    .setThumbnail(`https://singlecolorimage.com/get/${colorName}/128x128`);
}

// ================== BUTTONS ==================

function createMainButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('color_rojo').setLabel('🔴 Rojo').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_naranja').setLabel('🟠 Naranja').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_amarillo').setLabel('🟡 Amarillo').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_verde').setLabel('🟢 Verde').setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('color_azul').setLabel('🔵 Azul').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_violeta').setLabel('🟣 Violeta').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_rosa').setLabel('🌸 Rosa').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('color_neutro').setLabel('⚫ Neutro').setStyle(ButtonStyle.Secondary)
    )
  ];
}

function createShadeButtons(colorName) {
  const roles = categories.colores[colorName];
  const tonoNames = TONO_NAMES[colorName];
  const buttons = [];

  for (let i = 0; i < roles.length; i++) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`shade_${colorName}_${i}`)
        .setLabel(`${i + 1} - ${tonoNames[i]}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
  }

  return rows;
}

// ================== READY ==================

client.once("ready", async () => {
  console.log(`🚀 Bot iniciado como ${client.user.tag}`);
  console.log("📍 Canal:", CHANNEL_ID);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    let data = loadData();
    let message = null;

    if (data.messageId) {
      try {
        message = await channel.messages.fetch(data.messageId);
      } catch {}
    }

    if (!message) {
      message = await channel.send({
        embeds: [mainEmbed()],
        components: createMainButtons()
      });

      data.messageId = message.id;
      saveData(data);

      console.log("✅ Menú enviado");
    } else {
      console.log("✅ Menú ya existe");
    }

  } catch (error) {
    console.error("❌ Error en ready:", error.message);
  }
});

// ================== INTERACTIONS ==================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  const customId = interaction.customId;
  const now = Date.now();

  // ✅ COOLDOWN FIXED
  if (cooldowns.has(userId) && now < cooldowns.get(userId) + COOLDOWN_TIME) {
    return interaction.reply({
      content: "⏳ Espera " + Math.ceil((cooldowns.get(userId) + COOLDOWN_TIME - now) / 1000) + "s",
      ephemeral: true
    });
  }

  cooldowns.set(userId, now);
  setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);

  // ===== COLOR =====
  if (customId.startsWith('color_')) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const colorName = customId.replace('color_', '');
      console.log("🎨 Color elegido:", colorName, "por", interaction.user.tag);

      await interaction.editReply({
        embeds: [shadeEmbed(colorName)],
        components: createShadeButtons(colorName)
      });

    } catch (error) {
      console.error("❌ Error seleccionando color:", error);
    }
    return;
  }

  // ===== TONO =====
  if (customId.startsWith('shade_')) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const [_, colorName, index] = customId.split('_');
      const roleId = categories.colores[colorName][index];
      const tonoName = TONO_NAMES[colorName][index];

      console.log("👤 Usuario:", userId);
      const member = await interaction.guild.members.fetch(userId);

      console.log("🔄 Limpiando roles...");
      for (const r of allRoles) {
        await member.roles.remove(r).catch(() => {});
      }

      console.log("✨ Asignando rol:", roleId);
      await member.roles.add(roleId);

      const users = loadUsers();
      users[userId] = {
        color: colorName,
        role: roleId,
        tono: index,
        tonoName,
        time: Date.now()
      };
      saveUsers(users);

      const embed = new EmbedBuilder()
        .setTitle("✅ Color asignado")
        .setDescription(`**${HEX_COLORS[colorName].name}** → ${tonoName}`)
        .setColor(HEX_COLORS[colorName].hex);

      await interaction.editReply({
        embeds: [embed],
        components: []
      });

      console.log("✅ Rol asignado correctamente");

    } catch (error) {
      console.error("❌ Error asignando rol:", error);

      await interaction.editReply({
        content: "❌ Error al asignar rol: " + error.message
      });
    }
  }
});

// ================== LOGIN ==================

client.login(process.env.TOKEN);
