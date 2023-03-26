from Util.spells import Spell, DamageOverTime, Buff
from Util.environment import GeneralEnvironment, DamageType, Resource


# Define all spells
def Moonfire():
    return DamageOverTime(name="Moonfire",
                 initial_damage=.2,
                 duration_damage=0.174,
                 duration=22,
                 cast_time=0,
                 tick_length=2,
                 astral_power=2,
                 damage_type=DamageType.ARCANE,
                 procs_shooting_stars=True)

def Sunfire():
    return DamageOverTime(name="Sunfire", 
                 initial_damage=.2,
                 duration_damage=0.174,
                 duration=18,
                 cast_time=0,
                 tick_length=2,
                 astral_power=2,
                 damage_type=DamageType.NATURE,
                 procs_shooting_stars=True)

def StellarFlare():
    return DamageOverTime(name="Stellar Flare",
                 initial_damage=.125,
                 duration_damage=0.0875,
                 duration=24,
                 cast_time=0,
                 tick_length=2,
                 astral_power=8,
                 damage_type=DamageType.ASTRAL)      

def Wrath():
    return Spell(name="Wrath",
                 initial_damage=0.5775,
                 cast_time=1.5,
                 astral_power=6,
                 damage_type=DamageType.NATURE) 

def Starfire():
    return Spell(name="Starfire",
                 initial_damage=0.765,
                 cast_time=2.25,
                 astral_power=8,
                 damage_type=DamageType.ARCANE) 

def Starsurge():        
    return Spell(name="Starsurge",
                 initial_damage=2.07,
                 cast_time=0,
                 astral_power=-30,
                 damage_type=DamageType.ASTRAL) 

def FuryOfElune():
    return DamageOverTime(
                name="Fury Of Elune",
                initial_damage=0,
                duration_damage=0.165,
                duration=8,
                cast_time=0,
                tick_length=0.5,
                astral_power=0,
                ap_over_time=40.0 / 16.0,
                damage_type=DamageType.ASTRAL,
                cooldown=60
                ) 

def ShootingStar():
        # Shooting Stars is not an action that can be taken, but the spell info is still needed
        return Spell(name="Shooting Star",
                     initial_damage=0.36,
                     cast_time=0,
                     astral_power=3,
                     damage_type=DamageType.ASTRAL)

def Incarn():
    return Buff(
        cooldown=180,
        duration=41,
        name="Incarn"
    )

def RavenousFrenzy():
    return Buff(
        cooldown=180,
        duration=20,
        name="Ravenous Frenzy"
    )

def RavenousExhaust():
    return Buff(
        cooldown=0,
        duration=3,
        name="Ravenous Exhaust"
    )

def Orb():
    return Buff(
        cooldown=120,
        duration=40,
        name="Orb",
        useable_on_gcd = False
    )

def LunarEclipse():
    return Buff(
        name = "Lunar Eclipse",
        duration = 15
    )

def SolarEclipse():
    return Buff(
        name = "Solar Eclipse",
        duration = 15
    )