# WordPress Plugin Development Guidelines

## Architecture & SOLID Principles

**Single Responsibility Principle (SRP)**
- Each class has one reason to change - separate concerns (Admin, Public, Database, API calls)
- Use dedicated classes: `*Admin.php` for admin logic, `*Public.php` for frontend, `*Activator.php` for installation
- Functions should do one thing well - split large functions into smaller, focused ones

**Open/Closed Principle (OCP)**
- Extend functionality through hooks and filters, not by modifying existing code
- Use WordPress action/filter hooks: `add_action()`, `add_filter()`, `apply_filters()`, `do_action()`
- Create custom hooks for extensibility: `do_action('plugin_name_custom_hook', $data)`

**Liskov Substitution Principle (LSP)**
- Child classes must be substitutable for parent classes without breaking functionality
- Implement interfaces consistently across similar classes

**Interface Segregation Principle (ISP)**
- Create small, focused interfaces rather than large monolithic ones
- Separate admin interfaces from public interfaces

**Dependency Inversion Principle (DIP)**
- Depend on abstractions, not concrete implementations
- Use dependency injection where possible, especially for external services (APIs, databases)

## Code Standards

**WordPress Coding Standards**
- Follow WordPress PHP, JavaScript, CSS coding standards strictly
- Use WordPress nonce verification: `wp_verify_nonce()` for all form submissions
- Sanitize all inputs: `sanitize_text_field()`, `sanitize_email()`, etc.
- Escape all outputs: `esc_html()`, `esc_attr()`, `esc_url()`, etc.
- Internationalize all user-facing strings: `__()`, `_e()`, `_n()`

**Naming Conventions**
- Use unique prefixes for all functions, classes, and globals to avoid conflicts
- Classes: `WcBetterShippingCalculatorForBrazil*`  
- Functions: `wc_better_shipping_calculator_*`
- Hooks: `wc_better_shipping_calculator_*`

## Testing Requirements

**Unit Tests**
- Write PHPUnit tests for all business logic and utility functions
- Test WordPress hooks and filters behavior
- Mock external dependencies (WooCommerce, WordPress functions)
- Aim for 80%+ code coverage on critical paths

**Integration Tests**
- Test plugin activation/deactivation scenarios
- Test compatibility with WooCommerce updates
- Validate form submissions and data processing workflows

**Frontend Tests**
- Test JavaScript functionality with Jest or similar
- Validate React component behavior in WooCommerce Blocks
- Test responsive design and cross-browser compatibility

**Test Structure**
```php
// File: tests/unit/test-class-name.php
class Test_Class_Name extends WP_UnitTestCase {
    public function setUp(): void {
        parent::setUp();
        // Setup test data
    }
    
    public function test_specific_functionality() {
        // Arrange, Act, Assert pattern
    }
}
```

## Build Commands

```bash
# Install dependencies
npm install && composer install

# Build assets
npm run build

# Run tests  
composer test
npm test

# Code quality checks
composer psalm
```

## WordPress Plugin Specifics

**Hooks Priority**
- Use appropriate hook priorities to ensure correct execution order
- Document why specific priorities are chosen
- Test hook interactions with popular plugins

**Database Operations**
- Use `$wpdb` prepared statements for custom queries
- Leverage WordPress meta APIs when possible
- Create proper database cleanup routines in `uninstall.php`

**Asset Management**
- Use `wp_enqueue_script()` and `wp_enqueue_style()` properly
- Include asset versioning for cache busting
- Minimize HTTP requests with proper concatenation/minification

## Error Handling

- Use `WP_Error` for recoverable errors
- Log errors appropriately without exposing sensitive information
- Provide user-friendly error messages
- Implement graceful degradation for optional features

## Performance

- Cache expensive operations using WordPress transients
- Use lazy loading for admin-only functionality
- Optimize database queries - avoid N+1 problems
- Profile JavaScript performance in checkout flows