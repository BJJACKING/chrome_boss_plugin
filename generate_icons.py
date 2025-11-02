#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
生成Chrome插件图标
"""
from PIL import Image, ImageDraw
import os

# 创建icons目录
os.makedirs('icons', exist_ok=True)

# 创建不同尺寸的图标
sizes = [16, 48, 128]
for size in sizes:
    # 创建渐变背景
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # 绘制文档图标背景
    padding = max(2, size // 6)
    # 文档主体
    doc_x = padding
    doc_y = padding
    doc_w = size - padding * 2
    doc_h = size - padding * 2
    
    # 绘制文档形状（简单的矩形带折角）
    draw.rectangle([doc_x, doc_y, doc_x + doc_w * 0.9, doc_y + doc_h], fill='white')
    # 折角三角形
    triangle_points = [
        (doc_x + doc_w * 0.9, doc_y),
        (doc_x + doc_w, doc_y + doc_h * 0.15),
        (doc_x + doc_w * 0.9, doc_y + doc_h * 0.15)
    ]
    draw.polygon(triangle_points, fill='white')
    
    # 绘制筛选标记（✓）或线条
    if size >= 48:
        # 绘制对勾
        check_x = doc_x + doc_w * 0.3
        check_y = doc_y + doc_h * 0.4
        line_width = max(2, size // 20)
        # 对勾的两条线
        draw.line([(check_x, check_y), (check_x + doc_w * 0.15, check_y + doc_h * 0.15)], 
                  fill='#667eea', width=line_width)
        draw.line([(check_x + doc_w * 0.15, check_y + doc_h * 0.15), 
                   (check_x + doc_w * 0.3, check_y + doc_h * 0.05)], 
                  fill='#667eea', width=line_width)
    elif size >= 16:
        # 小图标只画一个简单的点
        center_x = doc_x + doc_w * 0.5
        center_y = doc_y + doc_h * 0.5
        dot_size = max(2, size // 8)
        draw.ellipse([center_x - dot_size, center_y - dot_size, 
                      center_x + dot_size, center_y + dot_size], 
                     fill='#667eea')
    
    img.save(f'icons/icon{size}.png')
    print(f'✓ 创建图标: icons/icon{size}.png ({size}x{size})')

print('\n所有图标创建完成！')

