from sqids import Sqids
import random


def generate_game_code() -> str:
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    return Sqids(min_length=4, alphabet=alphabet).encode([random.randint(0, 15000)])
