const Discord = require("discord.js")
const client = new Discord.Client()
const mongoose = require("mongoose")
const CF = require('./config')
const GK = require('./guvenilirliste.json')

const RolesDB = require('./Models/DataBaseRoles')
const ChannelsDB = require('./Models/DataBaseChannels')

client.on('ready', async() => {
client.user.setPresence({ activity: { name: CF.ServerMessage }, status: CF.ServerCase });
if (CF.VoiceID && client.channels.cache.has(CF.VoiceID)) client.channels.cache.get(CF.VoiceID).join().catch();
})


client.on("message", async(message) => {
if (!message.guild || message.author.bot || message.channel.type === 'dm') return;
let prefix = CF.Prefix.filter(p => message.content.startsWith(p))[0]; 
if (!prefix) return;
let args = message.content.split(' ').slice(1);
let command = message.content.split(' ')[0].slice(prefix.length); 

let embed = new Discord.MessageEmbed().setColor('RANDOM')


if(command === "güvenli") {
if (message.author.id !== CF.OwnerID) return    
let member = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
let guvenilirliste = GK.Guvenilir || []
if(!member) return message.channel.send(embed.setDescription(`Lütfen bir üye belirtin.`).setAuthor(message.guild.name, message.guild.iconURL({dynamic:true}))).then(x => x.delete({timeout:5000}))
if (guvenilirliste.some(g => g.includes(member.id))) {
guvenilirliste = guvenilirliste.filter(g => !g.includes(member.id));
GK.Guvenilir = guvenilirliste;
fs.writeFile("./guvenilirliste.json", JSON.stringify(GK), (err) => {if (err) console.log(err)})
message.channel.send(embed.setDescription(`${member} artık güvenli listede değil. 🚫`).setAuthor(message.guild.name, message.guild.iconURL({dynamic:true})))
} else {
GK.Guvenilir.push(`${member.id}`);
fs.writeFile("./guvenilirliste.json", JSON.stringify(GK), (err) => {if (err) console.log(err)});
message.channel.send(embed.setDescription(`${member} artık güvenli listede. ✅`).setAuthor(message.guild.name, message.guild.iconURL({dynamic:true})))}
};

if(command === 'güvenli-liste' || command === 'liste') { 
let guvenilirliste = GK.Guvenilir || [] 
GK.Guvenilir = guvenilirliste;
let gmap = guvenilirliste > 0 ? guvenilirliste.map(x => message.guild.members.cache.get(x.slice(1)) ? message.guild.members.cache.get(x.slice(1)) : x).join(`\n`) : "Listede kimse yok." 
message.channel.send(embed.addField("Güvenli Liste", guvenilirliste.length > 0 ? guvenilirliste.map(g => (message.guild.members.cache.has(g.slice(1)) ? (message.guild.members.cache.get(g.slice(1))) : g)).join('\n') : "Güvenilir listede kimse yok."))
}

if(command == "rol-yedekle" || command == "rol-yedek-al") {
message.channel.send(`İşlem tamamlandı. \`✅\``)    
//Kanal Save
message.guild.roles.cache.filter(x => x.name !== "@everyone").map(async(role) => {
let roleChannelOverwrites = [];    
message.guild.channels.cache.filter(c => c.permissionOverwrites.has(role.id)).forEach(c => {
let channelPerm = c.permissionOverwrites.get(role.id);
let dataSave = { id: c.id, allow: channelPerm.allow.toArray(), deny: channelPerm.deny.toArray() }
roleChannelOverwrites.push(dataSave)
})

await RolesDB.findOne({RoleID: role.id}, async(err, data) => {    
if(!data) { 
const newData = new RolesDB({_id: new mongoose.Types.ObjectId(), GuildID: message.guild.id, RoleID: role.id, RoleName: role.name, RoleColor: role.hexColor, RolePermissions: role.permissions, RoleMembers: role.members.map(x => x.id), RolePosition: role.position, RoleHoisted: role.hoist, RoleSize: role.members.size, RolechannelOverwrites: roleChannelOverwrites}); newData.save().catch(e => console.log(e))
} else if(data) {
data.GuildID = message.guild.id; data.RoleName = role.name; data.RoleColor = role.hexColor; data.RoleMembers = role.members.map(gmember => gmember.id); data.RolePosition = role.position; data.RoleHoisted = role.hoist; data.RoleSize = role.members.size; data.RolechannelOverwrites = roleChannelOverwrites
data.save().catch(e => console.log(e))
}})})}


if(command == "rol-kur" || command == "role-setup" || command === "r-s") {
let rolID = args[0] 
if(!rolID) return message.channel.send(`Silinmiş olan rolün idsini belirt tekrardan kurayım gardaş. -Ankara gücü sIpor`)
RolesDB.findOne({GuildID: message.guild.id, RoleID: rolID}, async(err, res) => {
if(!res) return message.channel.send(`Geçerli bir ID belirt !\n\`\`\`Eğer nasıl kurulucağını bilmiyorsan açıklıyayım:
Mongo datasına kayıtlı olan silinmiş eski rolün IDsini bulup !rol-kur ID yazarak kurulumu tamamlıyorsun umarım backup almışsındır yoksa bir işe yaramaz.
-Striga seni seviyor.
\`\`\``)    
let backupRole = await message.guild.roles.create({
data: {
name: res.RoleName,
color: res.RoleColor,
hoist: res.RoleHoisted,
permissions: res.RolePermissions,
position: res.RolePosition,
}, reason: "Striga Manuel Rol Backup"});

message.channel.send(`\`${res.RoleName}\` rolü oluşturuldu ve \`${res.RoleSize}\` kişiye dağıtılmaya başlanıyor !`)
if(!res) return;
setTimeout(() => {
let ChannelPerms = res.RolechannelOverwrites;
if (ChannelPerms) ChannelPerms.forEach((rolePerms, i) => {
let chl = role.guild.channels.cache.get(rolePerms.id);
if (!chl) return;
setTimeout(() => {
let channelPermDatas = {};
perm.allow.forEach(p => {channelPermDatas[p] = true;});
perm.deny.forEach(p => {channelPermDatas[p] = false;});
chl.createOverwrite(backupRole, channelPermDatas).catch(console.error)}, i*5000)})}, 5000);

let roleMembers = res.RoleMembers;
roleMembers.forEach((member, i) => {
let x = message.guild.members.cache.get(member);
if (!x || x.roles.cache.has(backupRole.id)) return;
setTimeout(() => {x.roles.add(backupRole.id).catch();}, i*2000)})
})}
})


mongoose.connect(CF.MongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
client.login(CF.Token).then(function(){console.log(`${client.user.tag} açıldı`)}, function(err){console.log('Token geçersiz.')})



























