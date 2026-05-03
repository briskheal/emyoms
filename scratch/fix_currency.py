import os

def fix_currency(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace ? with ₹ when followed by a number or in common currency patterns
    # Using the unicode character for ₹ directly
    fixed_content = content.replace('?0.00', '₹0.00')
    fixed_content = fixed_content.replace('?(', '₹(')
    fixed_content = fixed_content.replace('?{', '₹{')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    print(f"Fixed {file_path}")

fix_currency('index.html')
fix_currency('admin.html')
fix_currency('script.js')
fix_currency('admin-script.js')
