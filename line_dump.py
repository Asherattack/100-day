with open('src/App.tsx', 'r', encoding='utf-8') as fh:
    for idx, line in enumerate(fh, 1):
        if 100 <= idx <= 220:
            print(f"{idx:04d}: {line.rstrip()}")
