

#### **2.3.1. Đồ án: Nền tảng Cho vay và Vay mượn DeFi (DeFi Lending & Borrowing)**

* **Bối cảnh và Vấn đề:** Lending & Borrowing là một trong những trụ cột của DeFi, cho phép người dùng kiếm lãi từ tài sản nhàn rỗi hoặc vay tài sản khác bằng cách thế chấp. Các giao thức như Aave và Compound đã quản lý hàng tỷ đô la tài sản.32  
* **Thiết kế và Triển khai:**  
  * **Kiến trúc:**  
    * **Mô hình Pool-based:** Thay vì kết nối trực tiếp người cho vay và người đi vay (P2P), mô hình hiện đại sử dụng các "bể thanh khoản" (Liquidity Pools). Người cho vay gửi tài sản vào pool, và người đi vay vay từ pool đó.34  
    * **On-chain (LendingPool.sol):** Hợp đồng thông minh cốt lõi quản lý việc gửi tiền (deposit), rút tiền (withdraw), vay (borrow), trả nợ (repay), và thanh lý (liquidation).  
    * **Oracle:** Một thành phần cực kỳ quan trọng. Vì giá trị của tài sản thế chấp biến động, hợp đồng cần một nguồn cung cấp giá đáng tin cậy từ bên ngoài (oracle) để xác định khi nào một khoản vay trở nên dưới mức thế chấp và cần được thanh lý. Chainlink là tiêu chuẩn ngành cho việc này.34  
  * **Hợp đồng thông minh:**  
    * **Luồng Deposit:** Người dùng gửi token (ví dụ: ETH) vào pool và nhận lại một lượng "aToken" (ví dụ: aETH) tương ứng, đại diện cho phần của họ trong pool và tự động tích lũy lãi suất.  
    * **Luồng Borrow:** Người dùng phải gửi tài sản thế chấp trước. Dựa trên giá trị tài sản thế chấp và "hệ số sức khỏe" (health factor), họ có thể vay một loại tài sản khác từ pool.35  
    * **Lãi suất:** Lãi suất được xác định theo thuật toán dựa trên tỷ lệ cung và cầu của tài sản trong pool.34  
    * **Thanh lý (Liquidation):** Nếu giá trị tài sản thế chấp giảm xuống dưới một ngưỡng nhất định, bất kỳ ai cũng có thể trả một phần khoản vay và nhận lại một phần tài sản thế chấp với một mức chiết khấu.33  
  * **Tham khảo:** Nghiên cứu kiến trúc của Aave và Compound. Kho mã nguồn topflightapps/how-to-make-defi-lending-platform cung cấp một cái nhìn tổng quan về các tính năng cần thiết.34  
* **Demo và Báo cáo:**  
  * **Demo:** Demo các luồng chính: Người dùng A gửi ETH vào pool. Người dùng B gửi một token khác làm tài sản thế chấp và vay ETH. Mô phỏng việc giá tài sản thế chấp giảm để kích hoạt quá trình thanh lý.  
  * **Báo cáo:** Trình bày sâu về các khái niệm DeFi cốt lõi. Phân tích mô hình kinh tế của giao thức (tokenomics), vai trò sống còn của oracles, và các rủi ro bảo mật như tấn công cho vay nhanh (flash loan attack).