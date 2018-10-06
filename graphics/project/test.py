import pygame
import math
import numpy as np
from pygame.locals import *


pygame.init()
display_surface = pygame.display.set_mode((1000, 500))
ALL_POS = []
ORIGINAL_POS = []


def scatter():
    global ALL_POS, ORIGINAL_POS
    ORIGINAL_POS = []
    ALL_POS = []
    start_x = -200
    while start_x < 200:
        constraint = math.sqrt(200**2-start_x**2)
        start_z = -constraint
        while start_z < constraint:
            start_z += 10
            if not start_x**2+start_z**2 <= 200**2:
                continue
            if start_z > 50 or start_z < -50:
                ALL_POS.append([start_x, start_z])
                ORIGINAL_POS.append([start_x, start_z])
                assert start_x**2+start_z**2 <= 200**2
        start_x += 10


scatter()
new_center = 0
all_time_remove = 0
theta = 0.0
while True:
    an_event = pygame.event.poll()
    if an_event.type == KEYUP and an_event.key == K_k or an_event:

        display_surface.fill((255, 255, 255))

        x = 100*math.cos(theta) + 500
        y = 100 * math.sin(theta) + 250
        theta += 0.01
        if theta > math.pi*2:
            theta = 0.0

        pygame.draw.circle(display_surface, (0, 0, 0), (int(x), int(y)), 10)

        # for pos3 in ALL_POS:
        #     pygame.draw.circle(display_surface, (0, 0, 0), (int(500 + pos3[0]), int(250 + pos3[1])), 1)

        pygame.display.update()


