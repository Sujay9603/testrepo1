package com.yas.cart.repository;

import com.yas.cart.model.Cart;
import com.yas.cart.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Set<CartItem> findAllByCart(Cart cart);

    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);

    void deleteByCartIdAndProductId(Long cartId, Long productId);

    void deleteByCartIdAndProductIdIn(Long cartId, List<Long> productIds);
    @Query("select sum(ci.quantity) from CartItem ci where ci.cart.id = ?1")
    Integer countItemInCart(Long cartId);
}
