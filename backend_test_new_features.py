#!/usr/bin/env python3
"""
Backend API Test Suite for New Features
Tests the specific features requested in the Turkish review:
1. Admin user login (admin/admin123)
2. Product model new fields (unit_type, package_quantity)
3. Product endpoints with new fields
"""

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from frontend/.env
BACKEND_URL = "https://mobile-github-app.preview.emergentagent.com/api"

class NewFeaturesTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    def test_admin_login(self):
        """Test admin user login with admin/admin123"""
        print("\n=== Testing Admin Login (admin/admin123) ===")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Admin Login Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Admin Login JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            # Check token response structure
            required_fields = ["access_token", "token_type", "user"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_result("Admin Login Fields", False, 
                              f"Missing fields in response: {missing_fields}", data)
                return False
            
            # Verify user role is "yönetici"
            user = data.get("user", {})
            if user.get("role") != "yönetici":
                self.log_result("Admin Role Verification", False, 
                              f"Expected role 'yönetici', got '{user.get('role')}'", user)
                return False
            
            # Store token for authenticated requests
            self.auth_token = data["access_token"]
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            
            self.log_result("Admin Login", True, 
                          f"Admin login successful. Username: {user.get('username')}, Role: {user.get('role')}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Admin Login Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def test_create_product_with_kutu_fields(self):
        """Test creating product with new unit_type and package_quantity fields"""
        print("\n=== Testing Product Creation with Kutu Fields ===")
        
        if not self.auth_token:
            self.log_result("Product Creation Auth", False, "No authentication token available")
            return False, None
        
        # Test product with kutu unit_type
        product_data = {
            "name": "Aspirin Kutu",
            "barcode": f"KUTU{int(time.time())}",
            "quantity": 50,
            "min_quantity": 5,
            "brand": "Bayer",
            "category": "İlaç",
            "purchase_price": 120.00,
            "sale_price": 180.00,
            "description": "Kutu satış örneği",
            "unit_type": "kutu",
            "package_quantity": 12
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/products",
                json=product_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Product Creation Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False, None
            
            try:
                created_product = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Product Creation JSON", False, 
                              "Invalid JSON response", str(e))
                return False, None
            
            # Verify new fields are present and correct
            if created_product.get("unit_type") != "kutu":
                self.log_result("Product Unit Type", False, 
                              f"Expected unit_type 'kutu', got '{created_product.get('unit_type')}'", created_product)
                return False, None
            
            if created_product.get("package_quantity") != 12:
                self.log_result("Product Package Quantity", False, 
                              f"Expected package_quantity 12, got {created_product.get('package_quantity')}", created_product)
                return False, None
            
            self.log_result("Product Creation with Kutu", True, 
                          f"Product created successfully. ID: {created_product.get('id')}, Unit: {created_product.get('unit_type')}, Package: {created_product.get('package_quantity')}")
            return True, created_product
            
        except requests.exceptions.RequestException as e:
            self.log_result("Product Creation Connection", False, 
                          f"Connection error: {str(e)}")
            return False, None
    
    def test_create_product_with_adet_fields(self):
        """Test creating product with default adet unit_type"""
        print("\n=== Testing Product Creation with Adet Fields ===")
        
        if not self.auth_token:
            self.log_result("Product Adet Creation Auth", False, "No authentication token available")
            return False, None
        
        # Test product with default adet unit_type
        product_data = {
            "name": "Paracetamol Adet",
            "barcode": f"ADET{int(time.time())}",
            "quantity": 100,
            "min_quantity": 10,
            "brand": "Eczacıbaşı",
            "category": "İlaç",
            "purchase_price": 5.50,
            "sale_price": 8.00,
            "description": "Adet satış örneği",
            "unit_type": "adet"
            # package_quantity should be None/null for adet
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/products",
                json=product_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Product Adet Creation Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False, None
            
            try:
                created_product = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Product Adet Creation JSON", False, 
                              "Invalid JSON response", str(e))
                return False, None
            
            # Verify unit_type is adet
            if created_product.get("unit_type") != "adet":
                self.log_result("Product Adet Unit Type", False, 
                              f"Expected unit_type 'adet', got '{created_product.get('unit_type')}'", created_product)
                return False, None
            
            # package_quantity should be None for adet
            if created_product.get("package_quantity") is not None:
                self.log_result("Product Adet Package Quantity", False, 
                              f"Expected package_quantity None for adet, got {created_product.get('package_quantity')}", created_product)
                return False, None
            
            self.log_result("Product Creation with Adet", True, 
                          f"Product created successfully. ID: {created_product.get('id')}, Unit: {created_product.get('unit_type')}")
            return True, created_product
            
        except requests.exceptions.RequestException as e:
            self.log_result("Product Adet Creation Connection", False, 
                          f"Connection error: {str(e)}")
            return False, None
    
    def test_get_products_with_new_fields(self):
        """Test GET /api/products returns new fields"""
        print("\n=== Testing GET Products with New Fields ===")
        
        if not self.auth_token:
            self.log_result("Get Products Auth", False, "No authentication token available")
            return False
        
        try:
            response = self.session.get(f"{BACKEND_URL}/products", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Get Products Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                products = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Get Products JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            if not isinstance(products, list):
                self.log_result("Get Products Format", False, 
                              f"Expected list, got {type(products)}", products)
                return False
            
            if len(products) == 0:
                self.log_result("Get Products Empty", False, 
                              "No products found to verify new fields")
                return False
            
            # Check if products have new fields
            products_with_new_fields = 0
            for product in products:
                if "unit_type" in product and "package_quantity" in product:
                    products_with_new_fields += 1
            
            if products_with_new_fields == 0:
                self.log_result("Get Products New Fields", False, 
                              "No products found with unit_type and package_quantity fields", 
                              f"Total products: {len(products)}")
                return False
            
            self.log_result("Get Products with New Fields", True, 
                          f"Found {products_with_new_fields} products with new fields out of {len(products)} total")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Get Products Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def test_update_product_unit_type(self, product):
        """Test updating product unit_type and package_quantity"""
        print("\n=== Testing Product Update (Unit Type Change) ===")
        
        if not self.auth_token or not product:
            self.log_result("Product Update Auth", False, "No authentication token or product available")
            return False
        
        product_id = product.get("id")
        if not product_id:
            self.log_result("Product Update ID", False, "No product ID available")
            return False
        
        # Update product from adet to kutu
        update_data = {
            "unit_type": "kutu",
            "package_quantity": 24
        }
        
        try:
            response = self.session.put(
                f"{BACKEND_URL}/products/{product_id}",
                json=update_data,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result("Product Update Status", False, 
                              f"Expected 200, got {response.status_code}", response.text)
                return False
            
            try:
                updated_product = response.json()
            except json.JSONDecodeError as e:
                self.log_result("Product Update JSON", False, 
                              "Invalid JSON response", str(e))
                return False
            
            # Verify updates
            if updated_product.get("unit_type") != "kutu":
                self.log_result("Product Update Unit Type", False, 
                              f"Expected unit_type 'kutu', got '{updated_product.get('unit_type')}'", updated_product)
                return False
            
            if updated_product.get("package_quantity") != 24:
                self.log_result("Product Update Package Quantity", False, 
                              f"Expected package_quantity 24, got {updated_product.get('package_quantity')}", updated_product)
                return False
            
            self.log_result("Product Update", True, 
                          f"Product updated successfully. Unit: {updated_product.get('unit_type')}, Package: {updated_product.get('package_quantity')}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_result("Product Update Connection", False, 
                          f"Connection error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all new features tests"""
        print(f"🚀 Starting New Features Backend Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test 1: Admin Login (admin/admin123)
        admin_login_success = self.test_admin_login()
        
        if not admin_login_success:
            print("\n❌ Admin login failed - cannot proceed with other tests")
            return False
        
        # Test 2: Create product with kutu fields
        kutu_success, kutu_product = self.test_create_product_with_kutu_fields()
        
        # Test 3: Create product with adet fields
        adet_success, adet_product = self.test_create_product_with_adet_fields()
        
        # Test 4: Get products with new fields
        get_products_success = self.test_get_products_with_new_fields()
        
        # Test 5: Update product unit type
        update_success = False
        if adet_product:
            update_success = self.test_update_product_unit_type(adet_product)
        
        # Summary
        print("\n" + "=" * 60)
        print("🏁 NEW FEATURES TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Feature assessment
        feature_status = {
            "Admin Login (admin/admin123)": admin_login_success,
            "Product Kutu Creation": kutu_success,
            "Product Adet Creation": adet_success,
            "GET Products with New Fields": get_products_success,
            "Product Unit Type Update": update_success
        }
        
        print(f"\n📋 FEATURE STATUS:")
        for feature, status in feature_status.items():
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {feature}")
        
        all_passed = all(feature_status.values())
        
        if all_passed:
            print(f"\n✅ All new features working correctly!")
        else:
            print(f"\n⚠️ Some features need attention")
        
        return all_passed

def main():
    """Main test execution"""
    tester = NewFeaturesTester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()