import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { User } from './../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRatings } from './../src/users/usersRatings.entity';
import { Movie } from './../src/movies/movie.entity';
import { Category } from './../src/categories/category.entity';
import { AbScenario, UserTestResult } from './testHelpers/AbScenario';
import moviesJson from './../src/common/moviesShort.json';
import usersJson from './../src/common/usersShort.json';
import ratingsJson from './../src/common/ratingsShort.json';
import { UsersService } from './../src/users/users.service';
import { UsersRepoHelperService } from './../src/users/usersRepoHelper.service';
import * as csv from 'fast-csv';
import * as fs from 'fs';
import { MoviesRepoHelperService } from './../src/movies/moviesRepoHelper.service';
import { MoviesService } from './../src/movies/movies.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;
  let ratingsRepo: Repository<UsersRatings>;
  let categoriesRepo: Repository<Category>;
  let moviesRepo: Repository<Movie>;

  let abscenario: AbScenario;
  let usersRepoHelper: UsersRepoHelperService;
  let userService: UsersService;
  let moviesRepoHelper: MoviesRepoHelperService;
  let moviesService: MoviesService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
    ratingsRepo = app.get<Repository<UsersRatings>>(
      getRepositoryToken(UsersRatings),
    );
    categoriesRepo = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    moviesRepo = app.get<Repository<Movie>>(getRepositoryToken(Movie));

    abscenario = new AbScenario(
      usersRepo,
      ratingsRepo,
      moviesRepo,
      categoriesRepo,
    );
    usersRepoHelper = new UsersRepoHelperService(
      usersRepo,
      ratingsRepo,
      moviesRepo,
    );
    userService = new UsersService(
      usersRepoHelper,
      usersRepo,
      ratingsRepo,
      moviesRepo,
    );
    moviesRepoHelper = new MoviesRepoHelperService(moviesRepo);
    moviesService = new MoviesService(moviesRepo, ratingsRepo, userService);
    await app.init();
  });

  async function runTestProcedureForOneUser(
    oneUser: User,
    isUserUserSimilarity: boolean,
  ): Promise<UserTestResult[]> {
    const byPercentage = 0.1;
    const by = oneUser.ratings.length * byPercentage;

    const userTestResults: UserTestResult[] = [];
    const deletedAll: UsersRatings[] = [];

    let prev = 0;
    // for (let i = 1; i <= 5; i++) {
    for (let i = 1; i <= 5; i++) {
      const curr = prev + by;
      if (Math.floor(prev) == Math.floor(curr)) {
        prev = curr;
        continue;
      }
      prev = curr;

      const deletedRatings = await abscenario.reduceUserRatings(
        oneUser,
        Math.ceil(by),
      );
      // const deletedRatings = await abscenario.reduceUserRatings(oneUser, 1);
      deletedAll.push(...deletedRatings);
      let result;
      if (isUserUserSimilarity) {
        result = await abscenario.getPredictedRatingsFromOneUserWhenUU(
          oneUser,
          usersRepoHelper,
          userService,
        );
      } else {
        result = await abscenario.getPredictedRatingsFromOneUserWhenII(
          oneUser,
          moviesRepoHelper,
          moviesService,
        ); // item-item similarity
      }

      const movieTestResults = abscenario.getEstimateAndValueToCompare(
        result,
        deletedAll,
      );
      console.log(movieTestResults);

      const userTestResult: UserTestResult = {
        movieTestResults,
        reducedByPercentage: byPercentage * i,
        reducedByNumber: by * i,
        ...abscenario.countMseAndRmse(result, deletedAll),
      };
      userTestResults.push(userTestResult);
    }
    return userTestResults;
  }

  it(`should pass`, () => {
    expect(true).toEqual(true);
  });

  // it('complex test for one user and save to csv when user-user', async () => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);

  //   const usersPercentage = await abscenario.getUsersPercentage();
  //   const oneUser = usersPercentage[0];
  //   console.log(oneUser);
  //   const userTestResults = await runTestProcedureForOneUser(oneUser, true);

  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream('outOneUserCaseUserUser.csv');
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < userTestResults.length; i++) {
  //     for (let j = 0; j < userTestResults[i].movieTestResults.length; j++) {
  //       csvStream.write({
  //         predicted: userTestResults[i].movieTestResults[j].predicted,
  //         real: userTestResults[i].movieTestResults[j].real,
  //         reducedByNumber: userTestResults[i].reducedByNumber,
  //         reducedByPercent: userTestResults[i].reducedByPercentage,
  //         MSEValue: userTestResults[i].mse,
  //         RMSEValue: userTestResults[i].rmse,
  //       });
  //     }
  //   }
  //   csvStream.end();
  // });

  // it('complex test for many users and save to csv', async () => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);
  //   const resultsMultipleUsers: UserTestResult[][] = []; //(usertestresult[])[] for many users
  //   const usersPercent = 0.2;
  //   const totalUsers = await usersRepo.count();

  //   const n = Math.ceil(totalUsers * usersPercent);
  //   for (let i = 0; i < n; i++) {
  //     const user = (
  //       await usersRepo.find({
  //         relations: ['ratings', 'ratings.movie'],
  //         order: { id: 'ASC' },
  //         skip: i,
  //         take: 1,
  //       })
  //     )[0];
  //     console.log(user);
  //     resultsMultipleUsers.push(await runTestProcedureForOneUser(user, true));
  //     await abscenario.clearRepos();
  //     await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);
  //   }
  //   const globalSumMSE = [0, 0, 0, 0, 0];
  //   const nProc = [0, 0, 0, 0, 0];
  //   const globalSumRMSE = [0, 0, 0, 0, 0];

  //   for (let i = 0; i < n; i++) {
  //     for (let j = 0; j < resultsMultipleUsers[i].length; j++) {
  //       for (let percent = 1; percent <= 5; percent++) {
  //         if (resultsMultipleUsers[i][j].reducedByPercentage == 0.1 * percent) {
  //           for (
  //             let k = 0;
  //             k < resultsMultipleUsers[i][j].movieTestResults.length;
  //             k++
  //           ) {
  //             console.log('n' + percent);
  //             console.log(resultsMultipleUsers[i][j].movieTestResults[k]);
  //             globalSumMSE[percent - 1] += Math.abs(
  //               Number(
  //                 resultsMultipleUsers[i][j].movieTestResults[k].predicted,
  //               ) - Number(resultsMultipleUsers[i][j].movieTestResults[k].real),
  //             );
  //             globalSumRMSE[percent - 1] += Math.pow(
  //               globalSumMSE[percent - 1],
  //               2,
  //             );
  //             nProc[percent - 1]++;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream('outManyUsersMseRmseUserUser.csv');
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < 5; i++) {
  //     csvStream.write({
  //       MSEValue: globalSumMSE[i] / nProc[i],
  //       RMSEValue: globalSumRMSE[i] / nProc[i],
  //     });
  //   }
  //   csvStream.end();
  // });

  // it('complex test for one user and save to csv when item-item', async () => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);

  //   const usersPercentage = await abscenario.getUsersPercentage();
  //   const oneUser = usersPercentage[0];
  //   console.log(oneUser);
  //   const userTestResults = await runTestProcedureForOneUser(oneUser, false);

  //   console.log(userTestResults);

  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream('outOneUserCaseItemItem.csv');
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < userTestResults.length; i++) {
  //     for (let j = 0; j < userTestResults[i].movieTestResults.length; j++) {
  //       csvStream.write({
  //         predicted: userTestResults[i].movieTestResults[j].predicted,
  //         real: userTestResults[i].movieTestResults[j].real,
  //         reducedByNumber: userTestResults[i].reducedByNumber,
  //         reducedByPercent: userTestResults[i].reducedByPercentage,
  //         MSEValue: userTestResults[i].mse,
  //         RMSEValue: userTestResults[i].rmse,
  //       });
  //     }
  //   }
  //   csvStream.end();
  // });

  // it('complex test for many users and save to csv, Item-Item', async () => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);
  //   const resultsMultipleUsers: UserTestResult[][] = []; //(usertestresult[])[] for many users
  //   const usersPercent = 0.2;
  //   const totalUsers = await usersRepo.count();

  //   const n = Math.ceil(totalUsers * usersPercent);
  //   for (let i = 0; i < n; i++) {
  //     const user = (
  //       await usersRepo.find({
  //         relations: ['ratings', 'ratings.movie'],
  //         order: { id: 'ASC' },
  //         skip: i,
  //         take: 1,
  //       })
  //     )[0];
  //     console.log(user);
  //     resultsMultipleUsers.push(await runTestProcedureForOneUser(user, false));
  //     await abscenario.clearRepos();
  //     await abscenario.fillRepos(moviesJson, usersJson, ratingsJson);
  //   }
  //   const globalSumMSE = [0, 0, 0, 0, 0];
  //   const nProc = [0, 0, 0, 0, 0];
  //   const globalSumRMSE = [0, 0, 0, 0, 0];

  //   for (let i = 0; i < n; i++) {
  //     for (let j = 0; j < resultsMultipleUsers[i].length; j++) {
  //       for (let percent = 1; percent <= 5; percent++) {
  //         if (resultsMultipleUsers[i][j].reducedByPercentage == 0.1 * percent) {
  //           for (
  //             let k = 0;
  //             k < resultsMultipleUsers[i][j].movieTestResults.length;
  //             k++
  //           ) {
  //             console.log('n' + percent);
  //             console.log(resultsMultipleUsers[i][j].movieTestResults[k]);
  //             globalSumMSE[percent - 1] += Math.abs(
  //               Number(
  //                 resultsMultipleUsers[i][j].movieTestResults[k].predicted,
  //               ) - Number(resultsMultipleUsers[i][j].movieTestResults[k].real),
  //             );
  //             globalSumRMSE[percent - 1] += Math.pow(
  //               globalSumMSE[percent - 1],
  //               2,
  //             );
  //             nProc[percent - 1]++;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream('outManyUsersMseRmseItemItem.csv');
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < 5; i++) {
  //     csvStream.write({
  //       MSEValue: globalSumMSE[i] / nProc[i],
  //       RMSEValue: globalSumRMSE[i] / nProc[i],
  //     });
  //   }
  //   csvStream.end();
  // });
});
