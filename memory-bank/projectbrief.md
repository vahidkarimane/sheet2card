# Overview  
This product is a web-based order management platform designed to streamline the ordering process for a wholesaler’s network of distributors. The system eliminates traditional phone or manual ordering overhead by allowing distributors to easily log in, select products, and place an order, which then automatically notifies the wholesaler’s internal team (via a WhatsApp group) to prepare and fulfill the order. Distributors do not create accounts independently; the wholesaler manages distributor credentials entirely. By integrating with a Google Sheets document for product data, the solution ensures the wholesaler can quickly update products and stock information in a familiar environment.

# Core Features  
1. **Secure Login for Distributors**  
   - Distributors receive pre-assigned usernames and passwords from the wholesaler; they cannot sign up themselves.  
   - Ensures only authorized distributors can place orders.  
   - Simplifies onboarding since the wholesaler controls credential distribution.

2. **Product Catalog & Cart Management**  
   - Pulls product data from Google Sheets, which contains columns such as `ProductID`, `ProductName`, `ProductURL`, `ImageURL1`, `ImageURL2`, `OriginalPrice`, `CurrentPrice`, and `StockStatus`.  
   - Distributors can browse or search products by category (with each Google Sheet tab representing a category).  
   - Users can specify desired quantities and add items to a basket.  
   - Helps distributors quickly see product details and make bulk orders.

3. **Order Submission**  
   - Once ready, distributors review their cart on a confirmation page before final submission.  
   - The system then forwards the order details (including username, items, and quantities) to a predefined WhatsApp group for the internal team.  
   - Streamlines communication so the team can prepare the order immediately, without manual data re-entry.

4. **User Management for Wholesaler**  
   - Admin interface for the wholesaler to create, edit, and delete distributor credentials.  
   - Flexible control over who can access the ordering system.  
   - Ensures easy management of the distributor network.