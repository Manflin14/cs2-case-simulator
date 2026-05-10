// ===== PROBABILIDADES =====
export const RARITY_ODDS: Record<string, number> = {
  gold:       0.0026,
  covert:     0.0064,
  classified: 0.032,
  restricted: 0.1598,
  milspec:    0.7992,
}

export const SELL_PRICES: Record<string, number> = {
  gold:       18.00,
  covert:      4.50,
  classified:  1.25,
  restricted:  0.35,
  milspec:     0.08,
}

export const XP_TABLE: Record<string, number> = {
  gold:       500,
  covert:     100,
  classified:  30,
  restricted:  10,
  milspec:      2,
}

export const RARITY_LADDER = ['milspec', 'restricted', 'classified', 'covert', 'gold']

// ===== DADOS DAS CASES =====
export interface CaseItem {
  id: string
  name: string
  rarity: string
  color: string
  wear: string[]
  image: string
}

export interface CaseData {
  id: string
  name: string
  image: string
  price: number
  items: CaseItem[]
}

// Imagens hospedadas no Case Royale (caseroyale.com/images/game/)
const CR = 'https://caseroyale.com/images/game/'

export const CASES_DATA: CaseData[] = [
  // ── PRISMA CASE ──────────────────────────────────────────────────────────
  {
    id: 'prisma_case',
    name: 'Prisma Case',
    image: CR + 'prisma_case.png',
    price: 2.50,
    items: [
      // Mil-Spec
      { id: 'prisma_famas_crypsis',       name: 'FAMAS | Crypsis',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1070.png' },
      { id: 'prisma_p250_verdigris',      name: 'P250 | Verdigris',        rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1071.png' },
      { id: 'prisma_galil_akoben',        name: 'Galil AR | Akoben',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1072.png' },
      { id: 'prisma_mac10_whitefish',     name: 'MAC-10 | Whitefish',      rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1073.png' },
      { id: 'prisma_ak47_uncharted',      name: 'AK-47 | Uncharted',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1074.png' },
      { id: 'prisma_mp7_mischief',        name: 'MP7 | Mischief',          rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1068.png' },
      { id: 'prisma_p90_offworld',        name: 'P90 | Off World',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1069.png' },
      // Restricted
      { id: 'prisma_ump45_moonrise',      name: 'UMP-45 | Moonrise',       rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1077.png' },
      { id: 'prisma_deagle_lightrail',    name: 'Desert Eagle | Light Rail',rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1078.png' },
      { id: 'prisma_awp_atheris',         name: 'AWP | Atheris',           rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1079.png' },
      { id: 'prisma_mp5sd_gauss',         name: 'MP5-SD | Gauss',          rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1080.png' },
      { id: 'prisma_tec9_bamboozle',      name: 'Tec-9 | Bamboozle',       rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1076.png' },
      // Classified
      { id: 'prisma_r8_skullcrusher',     name: 'R8 Revolver | Skull Crusher', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1082.png' },
      { id: 'prisma_xm1014_incinegator',  name: 'XM1014 | Incinegator',   rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1083.png' },
      { id: 'prisma_aug_momentum',        name: 'AUG | Momentum',          rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1084.png' },
      // Covert
      { id: 'prisma_m4a4_emperor',        name: 'M4A4 | The Emperor',      rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1085.png' },
      { id: 'prisma_fiveseven_angrymob',  name: 'Five-SeveN | Angry Mob',  rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1086.png' },
      // Gold
      { id: 'prisma_knife_doppler',       name: '★ Karambit | Doppler',    rarity: 'gold',       color: '#e4ae39', wear: ['FN','MW'],                image: CR + '1528.png' },
    ],
  },

  // ── FRACTURE CASE ─────────────────────────────────────────────────────────
  {
    id: 'fracture_case',
    name: 'Fracture Case',
    image: CR + '1261.png',
    price: 3.00,
    items: [
      // Mil-Spec
      { id: 'fracture_p90_freight',       name: 'P90 | Freight',           rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1227.png' },
      { id: 'fracture_p2000_gnarled',     name: 'P2000 | Gnarled',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1228.png' },
      { id: 'fracture_ppbizon_runic',     name: 'PP-Bizon | Runic',        rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1229.png' },
      { id: 'fracture_ssg08_mainframe',   name: 'SSG 08 | Mainframe 001',  rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1230.png' },
      { id: 'fracture_p250_cassette',     name: 'P250 | Cassette',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1231.png' },
      { id: 'fracture_famas_commemoration',name: 'FAMAS | Commemoration',  rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1226.png' },
      // Restricted
      { id: 'fracture_galil_connexion',   name: 'Galil AR | Connexion',    rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1233.png' },
      { id: 'fracture_mac10_allure',      name: 'MAC-10 | Allure',         rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1234.png' },
      { id: 'fracture_mp5sd_kitbash',     name: 'MP5-SD | Kitbash',        rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1235.png' },
      { id: 'fracture_mag7_monstercall',  name: 'MAG-7 | Monster Call',    rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1236.png' },
      { id: 'fracture_tec9_brother',      name: 'Tec-9 | Brother',         rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1237.png' },
      // Classified
      { id: 'fracture_cz75_emerald',      name: 'CZ75-Auto | Emerald Quartz', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1239.png' },
      { id: 'fracture_ak47_cartouche',    name: 'AK-47 | Cartouche',       rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1240.png' },
      { id: 'fracture_mp9_hydra',         name: 'MP9 | Hydra',             rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1241.png' },
      // Covert
      { id: 'fracture_m4a4_in_living',    name: 'M4A4 | In Living Color',  rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1242.png' },
      { id: 'fracture_deagle_printstream',name: 'Desert Eagle | Printstream', rarity: 'covert',  color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1243.png' },
      // Gold
      { id: 'fracture_knife_gamma',       name: '★ Falchion Knife | Gamma Doppler', rarity: 'gold', color: '#e4ae39', wear: ['FN','MW'], image: CR + '1528.png' },
    ],
  },

  // ── DREAMS & NIGHTMARES CASE ──────────────────────────────────────────────
  {
    id: 'dreams_nightmares_case',
    name: 'Dreams & Nightmares Case',
    image: CR + 'dn_case.png',
    price: 1.80,
    items: [
      // Mil-Spec
      { id: 'dn_sawedoff_spiritboard',    name: 'Sawed-Off | Spirit Board', rarity: 'milspec',   color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1443.png' },
      { id: 'dn_fiveseven_scrawl',        name: 'Five-SeveN | Scrawl',     rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1444.png' },
      { id: 'dn_mac10_ensnared',          name: 'MAC-10 | Ensnared',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1445.png' },
      { id: 'dn_xm1014_zombie',           name: 'XM1014 | Zombie Offensive',rarity: 'milspec',   color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1446.png' },
      { id: 'dn_nova_sobriquet',          name: 'Nova | Sobriquet',        rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1447.png' },
      { id: 'dn_mp5sd_necro',             name: 'MP5-SD | Necro Jr.',      rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1448.png' },
      // Restricted
      { id: 'dn_galil_akoben',            name: 'Galil AR | Akoben',       rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1449.png' },
      { id: 'dn_glock_vogue',             name: 'Glock-18 | Vogue',        rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1450.png' },
      { id: 'dn_sg553_phantasm',          name: 'SG 553 | Phantasm',       rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1455.png' },
      { id: 'dn_mac10_subzero',           name: 'MAC-10 | Cyanospatter',   rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1456.png' },
      // Classified
      { id: 'dn_mp7_abyssal',             name: 'MP7 | Abyssal Apparition',rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1453.png' },
      { id: 'dn_famas_rem',               name: 'FAMAS | Rapid Eye Movement',rarity: 'classified',color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1451.png' },
      { id: 'dn_dual_melondrama',         name: 'Dual Berettas | Melondrama',rarity: 'classified',color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1452.png' },
      // Covert
      { id: 'dn_mp9_starlight',           name: 'MP9 | Starlight Protector',rarity: 'covert',    color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1454.png' },
      { id: 'dn_ak47_nightwish',          name: 'AK-47 | Nightwish',       rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1457.png' },
      // Gold
      { id: 'dn_knife_doppler',           name: '★ Shadow Daggers | Doppler', rarity: 'gold',    color: '#e4ae39', wear: ['FN','MW'],                image: CR + '1528.png' },
    ],
  },

  // ── RECOIL CASE ───────────────────────────────────────────────────────────
  {
    id: 'recoil_case',
    name: 'Recoil Case',
    image: CR + 'recoil_case.png',
    price: 2.80,
    items: [
      // Mil-Spec
      { id: 'recoil_famas_meow',          name: 'FAMAS | Meow 36',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1460.png' },
      { id: 'recoil_m4a4_polymag',        name: 'M4A4 | Poly Mag',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1461.png' },
      { id: 'recoil_r8_crazy8',           name: 'R8 Revolver | Crazy 8',   rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1463.png' },
      { id: 'recoil_m249_downtown',       name: 'M249 | Downtown',         rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1464.png' },
      { id: 'recoil_sg553_dragontech',    name: 'SG 553 | Dragon Tech',    rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1465.png' },
      { id: 'recoil_p250_visions',        name: 'P250 | Visions',          rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1459.png' },
      // Restricted
      { id: 'recoil_ak47_orion',          name: 'AK-47 | Orion',           rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1466.png' },
      { id: 'recoil_cz75_circaetus',      name: 'CZ75-Auto | Circaetus',   rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1467.png' },
      { id: 'recoil_mp5sd_kitbash',       name: 'MP5-SD | Kitbash',        rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1468.png' },
      { id: 'recoil_xm1014_irezumi',      name: 'XM1014 | Irezumi',        rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1512.png' },
      // Classified
      { id: 'recoil_awp_chromatic',       name: 'AWP | Chromatic Aberration', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1469.png' },
      { id: 'recoil_glock_laminate',      name: 'Glock-18 | Umbral Rabbit',rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1470.png' },
      { id: 'recoil_usp_printstream',     name: 'USP-S | Printstream',     rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1471.png' },
      // Covert
      { id: 'recoil_m4a1s_rizz',         name: 'M4A1-S | Risk Reward',    rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1472.png' },
      { id: 'recoil_ak47_head_shot',      name: 'AK-47 | Head Shot',       rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1473.png' },
      // Gold
      { id: 'recoil_knife_marble',        name: '★ M9 Bayonet | Marble Fade', rarity: 'gold',   color: '#e4ae39', wear: ['FN','MW'],                image: CR + '1528.png' },
    ],
  },

  // ── KILOWATT CASE ─────────────────────────────────────────────────────────
  {
    id: 'kilowatt_case',
    name: 'Kilowatt Case',
    image: CR + 'kilowatt_case.png',
    price: 3.50,
    items: [
      // Mil-Spec
      { id: 'kw_fiveseven_hybrid',        name: 'Five-SeveN | Hybrid',     rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1517.png' },
      { id: 'kw_mp7_justsmile',           name: 'MP7 | Just Smile',        rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1518.png' },
      { id: 'kw_m4a4_etchlord',           name: 'M4A4 | Etch Lord',        rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1519.png' },
      { id: 'kw_glock_block18',           name: 'Glock-18 | Block-18',     rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1520.png' },
      { id: 'kw_sawedoff_analog',         name: 'Sawed-Off | Analog Input',rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1521.png' },
      { id: 'kw_ssg08_dezastre',          name: 'SSG 08 | Dezastre',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1513.png' },
      { id: 'kw_ump45_motorized',         name: 'UMP-45 | Motorized',      rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1514.png' },
      // Restricted
      { id: 'kw_deagle_flows',            name: 'Desert Eagle | Ocean Drive', rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1522.png' },
      { id: 'kw_nova_bluebird',           name: 'Nova | Bluebird',         rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1523.png' },
      { id: 'kw_mac10_lightbox',          name: 'MAC-10 | Light Box',      rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1515.png' },
      // Classified
      { id: 'kw_awp_duality',             name: 'AWP | Duality',           rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1524.png' },
      { id: 'kw_p90_ventrush',            name: 'P90 | Vent Rush',         rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1525.png' },
      { id: 'kw_dual_hideout',            name: 'Dual Berettas | Hideout', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1516.png' },
      // Covert
      { id: 'kw_ak47_inheritance',        name: 'AK-47 | Inheritance',     rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1526.png' },
      { id: 'kw_usp_jawbreaker',          name: 'USP-S | Jawbreaker',      rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1527.png' },
      // Gold
      { id: 'kw_knife_fade',              name: '★ Butterfly Knife | Fade', rarity: 'gold',      color: '#e4ae39', wear: ['FN','MW'],                image: CR + '1528.png' },
    ],
  },

  // ── REVOLUTION CASE ───────────────────────────────────────────────────────
  {
    id: 'revolution_case',
    name: 'Revolution Case',
    image: CR + 'revolution_case.png',
    price: 2.50,
    items: [
      // Mil-Spec
      { id: 'rev_mac10_disco',            name: 'MAC-10 | Disco Tech',     rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1490.png' },
      { id: 'rev_mp5sd_phosphor',         name: 'MP5-SD | Phosphor',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1491.png' },
      { id: 'rev_ppbizon_space',          name: 'PP-Bizon | Space Cat',    rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1492.png' },
      { id: 'rev_tec9_fragment',          name: 'Tec-9 | Decimator',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1493.png' },
      { id: 'rev_nova_toy',               name: 'Nova | Toy Soldier',      rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1494.png' },
      { id: 'rev_ssg08_parallax',         name: 'SSG 08 | Parallax',       rarity: 'milspec',    color: '#4b69ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1495.png' },
      // Restricted
      { id: 'rev_sg553_hyperbeast',       name: 'SG 553 | Hyper Beast',    rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1496.png' },
      { id: 'rev_mp9_hydra',              name: 'MP9 | Hydra',             rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1497.png' },
      { id: 'rev_xm1014_incin',           name: 'XM1014 | Incinegator',    rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1498.png' },
      { id: 'rev_famas_commemoration',    name: 'FAMAS | Commemoration',   rarity: 'restricted', color: '#8847ff', wear: ['FN','MW','FT','WW','BS'], image: CR + '1499.png' },
      // Classified
      { id: 'rev_awp_duality',            name: 'AWP | Duality',           rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1500.png' },
      { id: 'rev_glock_bulletqueen',      name: 'Glock-18 | Bullet Queen', rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1501.png' },
      { id: 'rev_usps_printstream',       name: 'USP-S | Printstream',     rarity: 'classified', color: '#d32ce6', wear: ['FN','MW','FT','WW','BS'], image: CR + '1502.png' },
      // Covert
      { id: 'rev_ak47_inheritance',       name: 'AK-47 | Inheritance',     rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1503.png' },
      { id: 'rev_m4a1s_printstream',      name: 'M4A1-S | Printstream',    rarity: 'covert',     color: '#eb4b4b', wear: ['FN','MW','FT','WW','BS'], image: CR + '1504.png' },
      // Gold
      { id: 'rev_knife_karambit',         name: '★ Karambit | Case Hardened', rarity: 'gold',   color: '#e4ae39', wear: ['FN','MW'],                image: CR + '1528.png' },
    ],
  },
]

// ===== LÓGICA DE JOGO SERVER-SIDE =====

export function rollItemServer(items: CaseItem[]): CaseItem & { wear: string } {
  const rand = Math.random()
  let cumulative = 0
  const order = ['gold', 'covert', 'classified', 'restricted', 'milspec']

  for (const rarity of order) {
    cumulative += RARITY_ODDS[rarity] || 0
    const pool = items.filter(i => i.rarity === rarity)
    if (rand < cumulative && pool.length > 0) {
      const item = pool[Math.floor(Math.random() * pool.length)]
      const wears = item.wear?.length ? item.wear : ['FN','MW','FT','WW','BS']
      const wear = wears[Math.floor(Math.random() * wears.length)]
      return { ...item, wear, id: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
    }
  }

  // Fallback milspec
  const fallbackPool = items.filter(i => i.rarity === 'milspec')
  const fallback = fallbackPool[Math.floor(Math.random() * fallbackPool.length)] || items[0]
  const wears = fallback.wear?.length ? fallback.wear : ['FT']
  return { ...fallback, wear: wears[0], id: `${fallback.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }
}

export function generateCrashPoint(): number {
  // Distribuição geométrica com house edge ~4%
  const houseEdge = 0.04
  const r = Math.random()
  if (r < houseEdge) return 1.00 // instant crash
  return Math.max(1.01, parseFloat((1 / (1 - r) * (1 - houseEdge)).toFixed(2)))
}

export function rollDouble(): { color: string; slot: number } {
  // 15 slots: 7 vermelho, 7 preto, 1 verde
  const slot = Math.floor(Math.random() * 15)
  const color = slot === 7 ? 'green' : slot < 7 ? 'red' : 'black'
  return { color, slot }
}

export const DOUBLE_PAYOUTS: Record<string, number> = { red: 2, black: 2, green: 14 }

export function flipCoin(): 'ct' | 't' {
  return Math.random() < 0.5 ? 'ct' : 't'
}
