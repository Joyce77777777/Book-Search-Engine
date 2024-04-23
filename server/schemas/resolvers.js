const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, arg, context) => {

      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .populate('savedBooks')
          .select("-__v -password")
      
        return userData
      }
      
      throw new AuthenticationError("Not logged in!")
    }
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return { token, user };
    },

    addUser: async (parent, {email, username, password}) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (parent, args, context) => {
        if (context.user) {
          const updatedUser = await User.findByIdAndUpdate(
            context.user._id,
            { $addToSet: { savedBooks: args.book } },
            { new: true, populate: 'savedBooks' }
          );
          return updatedUser;
        }
        throw new AuthenticationError("You need to be logged in!");
    },
      
    removeBook: async (parent, args, context) => {
        if (context.user) {
            const updateUser = await User.findByIdAndUpdate(
            context.user._id,
            { $pull: { savedBooks: { bookId: args.bookId } } },
            { new: true, populate: 'savedBooks' }
            );
            return updateUser;
        }
        throw new AuthenticationError("You need to log in first!");
    }, 
  },
};

module.exports = resolvers;
