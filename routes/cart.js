const {Router} = require('express');
const router = Router();
const routeProtector = require('../middleware/auth');
const Course = require('../models/course');

function mapCartItems(cart) {
   return cart.items.map(c => ({
      ...c.courseId._doc,
      id: c.courseId.id,
      count: c.count
   }));
}

function computePrice(courses) {
   return courses.reduce((total, course) => {
      return total += course.price * course.count;
   }, 0);
}

router.post('/add', routeProtector, async (req, res) => {
   const course = await Course.findById(req.body.id);
   await req.user.addToCart(course);
   res.redirect('/cart');
});

router.delete('/remove/:id',routeProtector, async (req, res) => {
   await req.user.removeFromCart(req.params.id);
   const user = await req.user.populate('cart.items.courseId').execPopulate();
   const courses = mapCartItems(user.cart);
   const cart = {
      courses, price: computePrice(courses)
   };
   res.status(200).json(cart);
});

router.get('/',routeProtector, async (req, res) => {
   const user = await req.user
      .populate('cart.items.courseId')
      .execPopulate();

   const courses = mapCartItems(user.cart);
   res.render('cart', {
      title: 'Cart',
      courses,
      price: computePrice(courses),
      isCart: true
   });
});

module.exports = router;